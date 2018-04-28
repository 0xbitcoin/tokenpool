
var net = require('net');

const PORT = 5000;

module.exports =  {

   async init()
   {

      console.log('starting stratum server');

      this.stratumServer = new Server(PORT, '127.0.0.1');
      this.stratumServer.start(() => {
         console.log(`Server started successfully`, this.stratumServer.address);
      });

      setTimeout(() => this.sendChallenge(), 0);
   },


   sendChallenge() {
      console.log('sendChallenge');
      this.stratumServer.broadcast("New Challenge", null);
      setTimeout(() => this.sendChallenge(), 15 * 1000);
   }


}


class Server {


   constructor (port, address) {
      this.port = port || PORT;
      this.address = address || '127.0.0.1';
      this.clients = [];
   }


   start(callback) {

      var _this = this;
      var server = net.createServer();
      
      server.on('connection', (socket) => { 

         socket.setKeepAlive(true);
         var client = new StratumClient(socket);

         console.log(`${client.name} connected.`);

         // Validation, if the client is valid
         // if (!server._validateClient(client)) {
         //   client.socket.destroy();
         //   return;
         // }

         _this.clients.push(client);
         this.dumpClients();
      });

      server.listen(this.port, this.address);
      if (callback != undefined) {
         server.on('listening', callback);  
      }

   }

   broadcast(message, exceptMiner) {

      this.clients.forEach((client) => {
         if (client === exceptMiner)
            return;
         client.sendMessage(message);
      });
      // console.log(message.replace(/\n+$/, ""));

   }

   dumpClients() {
      this.clients.forEach((client) => {
         console.log(client.name);
      });
   }

}   // class Server


class StratumClient {
   
   constructor (socket) {
      this.address = socket.remoteAddress;
      this.port    = socket.remotePort;
      this.name    = `${this.address}:${this.port}`;
      this.socket  = socket;
      this.setupSocket();
   }

   setupSocket() {
      var dataBuffer = '';
      var _this = this;
      this.socket.setEncoding('utf8');

      this.socket.on('data', function(d){
         console.log(`${_this.name} said: ${d}`);
         _this.socket.write(`We got your message (${d}). Thanks!\n`);

         dataBuffer += d;
         if (Buffer.byteLength(dataBuffer, 'utf8') > 10240){ //10KB
            dataBuffer = '';
            // _this.emit('socketFlooded');
            // _this.socket.destroy();
            return;
         }
         if (dataBuffer.indexOf('\n') !== -1){
            var messages = dataBuffer.split('\n');
            var incomplete = dataBuffer.slice(-1) === '\n' ? '' : messages.pop();
            messages.forEach(function(message){
               if (message === '') return;
               var messageJson;
               try {
                  messageJson = JSON.parse(message);
               } catch(e) {
                  if (options.tcpProxyProtocol !== true || d.indexOf('PROXY') !== 0){
                     _this.emit('malformedMessage', message);
                     _this.socket.destroy();
                  }
                  return;
               }

               if (messageJson) {
                  handleMessage(messageJson);
               }
            });
            dataBuffer = incomplete;
         }
      });
      this.socket.on('close', function() {
         console.log(`${_this.name} disconnected.`);
         // _this.emit('socketDisconnect');
      });
      this.socket.on('error', function(err){
         // if (err.code !== 'ECONNRESET')
            // _this.emit('socketError', err);
      });
   }

   sendMessage (message) {
      this.socket.write(message);
   }

}
