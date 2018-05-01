

const EventEmitter = require('events');
var net = require('net');
var ipc = require('../lib/ipc');

const PORT = 5000;

module.exports =  {

   async init(accountConfig)
   {

      console.log('starting stratum server');

      this.stratumServer = new StratumServer(PORT, '127.0.0.1', accountConfig);
      this.stratumServer.start(() => {
         console.log(`Server started successfully`, this.stratumServer.address);
      });


      // send some new work packages regularly
      // setTimeout(() => this.newWork(), 0);
   },


   newWork() {
      this.stratumServer.broadcastWork();
      setTimeout(() => this.newWork(), 15 * 1000);
   }


}

////////////////////////////////////////////////////////////////////////////
// Class : StratumServer
////////////////////////////////////////////////////////////////////////////

class StratumServer {

   constructor (port, address, accountConfig) {
      this.port = port || PORT;
      this.address = address || '127.0.0.1';
      this.clients = {};
      this.currentChallenge = '';
      this.poolAddress = accountConfig.minting.address.toString();
   }


   start(callback) {

      var _this = this;
      var server = net.createServer();
      
      // handle client connections
      server.on('connection', (socket) => { 

         socket.setKeepAlive(true);

         let client = new StratumClient(socket);
         console.log(`${client.name} connected.`);

         client.on('subscription', function(account) {
            console.log('subscription account:', account)
            _this.clients[account] = client;
            // client.sendWork(_this.workParams);
            _this.dumpClients();

         }).on('submit', function(params, resultCallback) {
            // process the share
            // send result back to miner
            resultCallback(null, true);

         }).on('socketDisconnect', function() {
            delete _this.clients[client.account];
            _this.dumpClients();
         });

      });

      // handle incoming ipc data from other modules
      this.ipcClient = new ipc.IpcClient('master');
      this.ipcClient.on('challengeNumber', function(challenge) {
         _this.currentChallenge = challenge;
         // console.log('stratum server received new challenge:', challenge);
      }).on('varDiff', function(data) {
         let workData = JSON.parse(data)
         console.log('new miner vardiff data received for:', workData.miner);
         if (_this.clients.hasOwnProperty(workData.miner)) {
            let client = _this.clients[workData.miner];
            client.varDiff = workData.varDiff;
            client.target = workData.target;
            client.sendWork([_this.currentChallenge, client.target, client.varDiff, _this.poolAddress]);
         }
      });

      server.listen(this.port, this.address);

      if (callback != undefined) {
         server.on('listening', callback);  
      }

   }

   broadcastWork () {
      for (var c in this.clients) {
         var client = this.clients[c];
         client.sendWork(this.workParams);
      }

      /* Some miners will consider the pool dead if it doesn't receive a job for around a minute.
         So every time we broadcast jobs, set a timeout to rebroadcast in X seconds unless cleared. */
      // clearTimeout(rebroadcastTimeout);
      // rebroadcastTimeout = setTimeout(function(){
      //    _this.emit('broadcastTimeout');
      // }, options.jobRebroadcastTimeout * 1000);
   }

   dumpClients() {
      console.log('Dump Clients:');
      for (var c in this.clients) {
         var client = this.clients[c];
         console.log(client.name);
      }
   }

}  


////////////////////////////////////////////////////////////////////////////
// Class : StratumClient
////////////////////////////////////////////////////////////////////////////

class StratumClient extends EventEmitter {
   
   constructor (socket) {
      super();

      // network data
      this.address = socket.remoteAddress;
      this.port    = socket.remotePort;
      this.name    = `${this.address}:${this.port}`;

      // miner data
      this.account = '';
      this.diff    = null;
      this.target  = null;

      var _this = this;
      this.socket  = socket;
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
                  _this.emit('malformedMessage', message);
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
      switch(message.method){
         case 'mining.subscribe':
            this.handleSubscribe(message);
            break;
         // case 'mining.authorize':
         //    handleAuthorize(message, true /*reply to socket*/);
         //    break;
         case 'mining.submit':
            this.handleSubmit(message);
            break;
         default:
            this.emit('unknownStratumMethod', message);
            break;
      }
   }

   handleSubscribe(message) {
      this.account = message.params[0];
      console.log('subscription from', this.name);
      this.emit('subscription', message.params[0]);
   }

   handleSubmit(message) {
      var _this = this;
      console.log('received share from', this.name);
      if (!this.account) {
         this.sendJson({
            id    : message.id,
            result: null,
            error : "not subscribed"
         });
         return;
      }
      this.emit('submit',
         {
            nonce            : message.params[0],
            minerEthAddress  : message.params[1],
            digest           : message.params[2],
            difficulty       : message.params[3],
            challenge        : message.params[4]
         },
         function(error, result) {
            _this.sendJson({
               id: message.id,
               result: result,
               error: error
            });
         }
      );
   }

   sendWork(workParams) {
      // expecting [challenge, target, difficulty, poolAddress]
      this.sendJson({
         method : "mining.notify",
         params: [workParams[0], workParams[1], workParams[2], workParams[3]]
      });
   }

   sendJson(response) {
      this.socket.write(JSON.stringify(response) + '\n');
   }

}
