

const EventEmitter = require('events');
var net = require('net');
var ipc = require('../lib/ipc');
var web3utils =  require('web3-utils');
const poolConfig = require('../pool.config').config

const PORT = 9192;
const HOST = '127.0.0.1';

const REBROADCAST_INTERVAL = 60;     // seconds
const CONNECTION_TIMEOUT = 600;     // seconds


////////////////////////////////////////////////////////////////////////////
// Class : StratumServer
////////////////////////////////////////////////////////////////////////////

module.exports =  class StratumServer {

   constructor (accountConfig, redisInterface) {
      this.port = PORT;
      this.address = HOST;
      this.clients = {};            // miners currently connected
      this.currentChallenge = '';
      this.ethBlockNumber = 0;
      this.poolAddress = accountConfig.minting.address.toString();
      this.redisInterface=redisInterface;
      this.rebroadcastTimeout = null;

   }


   async start() {
      console.log('starting stratum server');
      var _this = this;
      this.currentChallenge = await this.redisInterface.loadRedisData('challengeNumber');
      this.ethBlockNumber = parseInt( await this.redisInterface.loadRedisData('ethBlockNumber' ));

      var server = net.createServer((socket) => {
         _this.handleNewConnection(socket);
      });

      server.listen(this.port, this.address);
      console.log('listening on port', this.port);

      // handle incoming ipc data from other modules: for new challenge #, and updated vardiff for miners
      this.setupIpc();

      // there won't actually be any miners connected yet, but do it anyway to get the rebroadcast timer working
      this.broadcastWork();
   }


   async handleNewConnection(socket) { 
      var _this = this;
      socket.setKeepAlive(true);

      let client = new StratumClient(socket);
      console.log(`${client.name} connected.`);

      client.on('subscription', function(account, resultCallback) {
         // handle mining.subscribe
         _this.handleSubscription(client, account, resultCallback);

      }).on('submit', function(params, resultCallback) {
         _this.handleShareSubmit(client, params, resultCallback);

      }).on('socketDisconnect', function() {
         delete _this.clients[client.account];
      });
   }


   setupIpc() {
      var _this = this;
      this.ipcClient = new ipc.IpcClient('master');

      this.ipcClient.on('challengeNumber', function(challenge) {
         // new challenge #. broadcast to all miners.
         _this.currentChallenge = challenge;
         _this.broadcastWork();

      }).on('ethBlockNumber', function(ethBlockNumber) {
         _this.ethBlockNumber = ethBlockNumber;

      }).on('varDiff', function(data) {
         // updated vardiff for a specific miner
         let workData = JSON.parse(data)
         // is he currently connected?
         if (_this.clients.hasOwnProperty(workData.miner)) {
            let client = _this.clients[workData.miner];
            client.varDiff = workData.varDiff;
            client.target = workData.target;
            client.sendWork(_this.currentChallenge,  _this.poolAddress);
         }
      });
   }

   async handleSubscription(client, account, resultCallback) {
      if (!web3utils.isAddress(account)) {
         resultCallback([20, 'Invalid ETH account'], false);
         return;
      }
      this.clients[account] = client;
      client.varDiff = await this.getMinerVarDiff(account);
      client.target = this.getTargetFromDifficulty(client.varDiff);
      resultCallback(null, true);
      client.sendWork(this.currentChallenge, this.poolAddress);
   }

   async handleShareSubmit(client, params, resultCallback) {

      var nonce            = params[0];
      var minerEthAddress  = params[1];
      var digest           = params[2];
      var difficulty       = params[3];
      var challengeNumber  = params[4];

      if(
         difficulty == null  ||
         nonce == null  ||
         minerEthAddress == null  ||
         challengeNumber == null  ||
         digest == null
      ) {
         resultCallback([20, 'Invalid share parameters'], false);
         return;
      }

      if (challengeNumber != this.currentChallenge) {
         resultCallback([21, 'Wrong challenge number'], false);
         return;
      }

      if (difficulty < client.varDiff) {
         resultCallback([23, 'Low difficulty share'], false);
         return;
      }

      var computed_digest = web3utils.soliditySha3(this.currentChallenge, this.poolAddress, nonce);
      if(computed_digest !== digest)
      {
         resultCallback([20, 'Invalid digest'], false);
         return;
      }

      var digestBigNumber = web3utils.toBN(digest);
      var claimedTarget = this.getTargetFromDifficulty(difficulty);
      if(digestBigNumber.gte(claimedTarget))
      {
         resultCallback([23, 'Target not met'], false);
         return;
      }

      var shareData = {
         block:            this.ethBlockNumber,
         nonce:            nonce,
         minerEthAddress:  minerEthAddress,
         challengeNumber:  challengeNumber,
         digest:           digest,
         difficulty:       difficulty
      };

      var response = await this.redisInterface.pushToRedisList("queued_shares_list", JSON.stringify(shareData));

      resultCallback(null, true);
   }

   broadcastWork() {
      var _this = this;
      for (var c in this.clients) {
         let client = this.clients[c];
         client.sendWork(this.currentChallenge, this.poolAddress);
      }

      /* Some miners will consider the pool dead if it doesn't receive a job for around a minute.
         So every time we broadcast jobs, set a timeout to rebroadcast in X seconds unless cleared. */
      clearTimeout(this.rebroadcastTimeout);
      this.rebroadcastTimeout = setTimeout(function() {
         _this.broadcastWork();
      }, REBROADCAST_INTERVAL * 1000);
   }

   dumpClients() {
      console.log('Dump Clients:');
      for (var c in this.clients) {
         var client = this.clients[c];
         console.log(client.name);
      }
   }

   async getMinerVarDiff(minerEthAddress) {
      var minerData = {};

      var jsonData = await this.redisInterface.findHashInRedis("miner_data", minerEthAddress );
      if(jsonData == null) {
         minerData = this.getDefaultMinerData();
      } else {
         minerData = JSON.parse(jsonData)
      }

      var varDiff = minerData.varDiff;
      if (varDiff < poolConfig.minimumShareDifficulty)
         varDiff = poolConfig.minimumShareDifficulty;

      return varDiff;
   }

   getDefaultMinerData(){
     return {
       shareCredits: 0,
       tokenBalance: 0, //what the pool owes
       tokensAwarded:0,
       varDiff: 1, //default
       validSubmittedSolutionsCount: 0
     }
   }

   getTargetFromDifficulty(difficulty)
   {
      var max_target = web3utils.toBN( 2 ).pow( web3utils.toBN( 234 ) ) ;
      return max_target.div( web3utils.toBN( difficulty) );
   }

}  


////////////////////////////////////////////////////////////////////////////
// Class : StratumClient
////////////////////////////////////////////////////////////////////////////

// represents a connected miner.

class StratumClient extends EventEmitter {
   
   constructor (socket) {
      super();

      // network data
      this.address = socket.remoteAddress;
      this.port    = socket.remotePort;
      this.name    = `${this.address}:${this.port}`;

      // miner data
      this.account = '';
      this.varDiff = null;
      this.target  = null;

      var _this = this;
      this.socket = socket;
      this.socket.setEncoding('utf8');

      this.socket.on('data', function(d) {
         _this.handleData(d);

      }).on('close', function() {
         console.log(`${_this.name} disconnected.`);
         _this.emit('socketDisconnect');

      }).on('error', function(err){
         if (err.code !== 'ECONNRESET')
            console.log('Socket error from ' + _this.name + ': ' + JSON.stringify(err));
      });

      this.lastActivity = Date.now();
   }

   handleData(d) {
      var _this = this;
      var dataBuffer = '';

      dataBuffer += d;
      if (Buffer.byteLength(dataBuffer, 'utf8') > 10240) { //10KB
         dataBuffer = '';
         this.socket.destroy();
         console.log('Detected socket flooding from ' + this.name);
         return;
      }
      if (dataBuffer.indexOf('\n') !== -1) {
         var messages = dataBuffer.split('\n');
         var incomplete = dataBuffer.slice(-1) === '\n' ? '' : messages.pop();
         messages.forEach(function(message) {
            if (message === '') return;
            var messageJson;
            try {
               messageJson = JSON.parse(message);
            } catch(e) {
               if (options.tcpProxyProtocol !== true || d.indexOf('PROXY') !== 0) {
                  _this.emit('invalidJSON', message);
                  _this.socket.destroy();
               }
               return;
            }

            if (messageJson) {
               _this.handleMessage(messageJson);
            }
         });
         dataBuffer = incomplete;
      }
   }

   handleMessage(message){
      // console.log('handleMessage:', message);
      switch(message.method){
         case 'mining.subscribe':
            this.handleSubscribe(message);
            break;
         // case 'mining.authorize':
         //    handleAuthorize(message, true /*reply to socket*/);
         //    break;
         case 'mining.submit':
            this.lastActivity = Date.now();
            this.handleSubmit(message);
            break;
         default:
            this.emit('unknownStratumMethod', message);
            this.sendJson({
               id: message.id,
               result: null,
               error: [20, 'Unknown stratum method']
            });
            break;
      }
   }

   handleSubscribe(message) {
      var _this = this;
      this.account = message.params[0];
      this.emit('subscription', this.account, 
         function(error, result) {
            _this.sendJson({
               id: message.id,
               result: result,
               error: error
            });
         }
      );
   }

   handleSubmit(message) {
      var _this = this;
      console.log('received share from', this.name);
      if (!this.account) {
         this.sendJson({
            id    : message.id,
            result: null,
            error : [25, "Not subscribed"]
         });
         return;
      }
      this.emit('submit', message.params, 
         function(error, result) {
            _this.sendJson({
               id: message.id,
               result: result,
               error: error
            });
         }
      );
   }

   sendWork(challenge, poolAddress) {
      var lastActivityAgo = Date.now() - this.lastActivity;
      if (lastActivityAgo > CONNECTION_TIMEOUT * 1000){
         this.socket.destroy();
         return;
      }
      this.sendJson({
         method : "mining.notify",
         params: [challenge, this.target.toString(), this.varDiff, poolAddress]
      });
   }

   sendJson(response) {
      // console.log('sendJson:', response);
      this.socket.write(JSON.stringify(response) + '\n');
   }

}


