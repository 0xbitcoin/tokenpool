

const EventEmitter = require('events');
var net = require('net');
var ipc = require('../lib/ipc');
var web3utils =  require('web3-utils');
const poolConfig = require('../pool.config').config;
var peerUtils = require('./peer-utils');

var logger = require('./log');
var LogS = logger.LogS;
var LogD = logger.LogD;
var LogB = logger.LogB;

const PORT = 9192;
const HOST = '0.0.0.0';

const SENDWORK_INTERVAL  = 60;      // seconds
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
      this.connections = 0;
      logger.init();
   }


   async start() {
      LogB('======= starting stratum server =======');
      var _this = this;
      this.currentChallenge = await this.redisInterface.loadRedisData('challengeNumber');
      this.ethBlockNumber = parseInt( await this.redisInterface.loadRedisData('ethBlockNumber' ));

      var server = net.createServer((socket) => {
         _this.handleNewConnection(socket);
      });

      server.listen(this.port, this.address);
      LogB('listening on port', this.port);

      // handle incoming ipc data from other modules: for new challenge #, and updated vardiff for miners
      this.setupIpc();
   }


   async handleNewConnection(socket) { 
      var _this = this;

      this.connections++;
      socket.setKeepAlive(true);
      let client = new StratumClient(socket);

      LogB(`${client.name} connected. socket connections:`, this.connections);

      client.on('subscription', function(account, resultCallback) {
         _this.handleSubscription(client, account, resultCallback);

      }).on('submit', function(params, resultCallback) {
         _this.handleShareSubmit(client, params, resultCallback);

      }).on('socketDisconnect', function() {
         _this.connections--;
         delete _this.clients[client.account];
         client.cleanUp();
         LogB(`${client.name} disconnected. socket connections:`, _this.connections);
      });
   }


   setupIpc() {
      var _this = this;
      this.ipcClient = new ipc.IpcClient('master');

      this.ipcClient.on('challengeNumber', function(challenge) {
         // new challenge #. broadcast to all miners.
         LogD('challenge number:', challenge.substr(0, 12));
         _this.currentChallenge = challenge;
         _this.broadcastWork();

      }).on('ethBlockNumber', function(ethBlockNumber) {
         // LogD('ETH block number:', ethBlockNumber);
         _this.ethBlockNumber = ethBlockNumber;

      }).on('varDiff', function(data) {
         // updated vardiff for a specific miner. 
         // expecting data = {miner: address, varDiff: value, target: target}
         let workData = JSON.parse(data)
         LogD('updated vardiff for', workData.miner.substr(0, 12), ', varDiff:', workData.varDiff);
         // is he currently connected?
         if (_this.clients.hasOwnProperty(workData.miner)) {
            let client = _this.clients[workData.miner];
            client.varDiff = workData.varDiff;
            client.target = workData.target;
            client.sendWork(_this.currentChallenge,  _this.poolAddress, false);
         }
      });
   }

   async handleSubscription(client, account, resultCallback) {
      if (!web3utils.isAddress(account)) {
         LogB(`${client.name} subscription rejected. Invalid ETH account`);
         resultCallback([20, 'Invalid ETH account'], false);
         return;
      }
      this.clients[account] = client;
      LogD(`${client.name} subscribed. ETH address:`, account, ', miner count:', Object.keys(this.clients).length);
      client.varDiff = await this.getMinerVarDiff(account);
      client.target = this.getTargetFromDifficulty(client.varDiff);
      resultCallback(null, true);
      client.sendWork(this.currentChallenge, this.poolAddress, false);
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
      LogD('broadcast work');
      var _this = this;
      for (var c in this.clients) {
         let client = this.clients[c];
         client.sendWork(this.currentChallenge, this.poolAddress, false);
      }
   }

   async getMinerVarDiff(minerEthAddress) {
      var minerData = {};

      var jsonData = await this.redisInterface.findHashInRedis("miner_data", minerEthAddress );
      if (jsonData == null) {
         minerData = peerUtils.getDefaultMinerData();
         await this.redisInterface.storeRedisHashData("miner_data", minerEthAddress , JSON.stringify(minerData))
      } else {
         minerData = JSON.parse(jsonData)
      }

      var varDiff = minerData.varDiff;
      if (varDiff < poolConfig.minimumShareDifficulty)
         varDiff = poolConfig.minimumShareDifficulty;

      return varDiff;
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
      this.account = '';		// ETH address
      this.varDiff = null;
      this.target  = null;

      var _this = this;
      this.socket = socket;
      this.socket.setEncoding('utf8');

      this.socket.on('data', function(d) {
         _this.handleData(d);

      }).on('close', function() {
         _this.emit('socketDisconnect');

      }).on('error', function(err){
         if (err.code !== 'ECONNRESET')
            LogS('Socket error from ' + _this.name + ': ' + JSON.stringify(err));
      });

      this.lastActivity = Date.now();
      this.sendWorkTimeout = null;

   }

   handleData(d) {
      var _this = this;
      var dataBuffer = '';

      dataBuffer += d;
      if (Buffer.byteLength(dataBuffer, 'utf8') > 10240) { //10KB
         dataBuffer = '';
         this.socket.destroy();
         LogB('Detected socket flooding from ' + this.name);
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
               _this.emit('invalidJSON', message);
               LogB('invalid JSON received:', message);
               _this.socket.destroy();
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
      // LogS('handleMessage:', message);
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
            LogB('Alert: unknown stratum method received from', this.name);
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
            if (!result)
               _this.socket.destroy();
         }
      );
   }

   handleSubmit(message) {
      var _this = this;
      if (!this.account) {
         LogB('Alert: share received from unsubscribed miner', this.name);
         this.sendJson({
            id    : message.id,
            result: null,
            error : [25, "Not subscribed"]
         });
         return;
      }
      LogD('received share from', this.account.substr(0, 12));
      this.emit('submit', message.params, 
         function(error, result) {
            if (!result) {
               LogB(`Alert: rejected share from ${_this.account.substr(0, 12)}. reason: ${error[1]}`);
            }
            _this.sendJson({
               id: message.id,
               result: result,
               error: error
            });
         }
      );
   }

   cleanUp() {
      clearTimeout(this.sendWorkTimeout);
   }

   sendWork(challenge, poolAddress, fromTimer) {
      var _this = this;

      // drop the miner if he hasn't submitted a share for a long time
      var lastActivityAgo = Date.now() - this.lastActivity;
      if (lastActivityAgo > CONNECTION_TIMEOUT * 1000) {
         LogB('Alert: inactive miner ' + this.account + '. dropping connection');
         this.socket.destroy();
         return;
      }

      this.sendJson({
         method : "mining.notify",
         params: [challenge, this.target.toString(), this.varDiff, poolAddress]
      });

      // Some miners will consider the pool dead if it doesn't receive a job for around a minute, so send work regularly.
      var interval = SENDWORK_INTERVAL * 1000;
      if (!fromTimer) {
         // if this is a mandatory sendWork (ie. something changed and the miner needs to know), schedule the next one
         // randomly, to avoid unnecessary strain on the server.
         // get a random # between interval/2 and interval
         interval = Math.floor(Math.random() * (interval - interval/2 + 1) + interval/2);
      }
      clearTimeout(this.sendWorkTimeout);
      this.sendWorkTimeout = setTimeout(function() {
         _this.sendWork(challenge, poolAddress, true);
      }, interval);
   }

   sendJson(response) {
      // LogS('sendJson:', response);
      this.socket.write(JSON.stringify(response) + '\n');
   }

}


