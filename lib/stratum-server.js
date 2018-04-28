
var net = require('net');

const PORT = 5000;

module.exports =  {


  async init()
  {

    console.log('starting stratum server');

    var stratumServer = new Server(PORT, '127.0.0.1');

    stratumServer.start(() => {
      console.log(`Server started successfully`, stratumServer.address);
    });

  },


}


class Server {


  constructor (port, address) {
    this.port = port || PORT;
    this.address = address || '127.0.0.1';
    this.miners = [];
  }


  start(callback) {

    var self = this;
    var server = net.createServer();
    
    server.on('connection', (socket) => { 

      var miner = new Miner(socket);

      console.log(`${miner.name} connected.`);

      // Validation, if the miner is valid
      // if (!server._validateClient(miner)) {
      //   miner.socket.destroy();
      //   return;
      // }

      self.miners.push(miner);
      this.dumpMiners();
      
      socket.on('data', (data) => { 
        let m = data.toString().replace(/[\n\r]*$/, '');
        console.log(`${miner.name} said: ${m}`);
        socket.write(`We got your message (${m}). Thanks!\n`);
      });
      
      // Triggered when this miner disconnects
      socket.on('end', () => {
        self.miners.splice(self.miners.indexOf(miner), 1);
        console.log(`${miner.name} disconnected.`);
        self.dumpMiners();
      });

    });

    server.listen(this.port, this.address);
    if (callback != undefined) {
      server.on('listening', callback);  
    }

  }

  broadcast(message, exceptMiner) {

    this.miners.forEach((miner) => {
      if (miner === exceptMiner)
        return;
      miner.sendMessage(message);
    });
    console.log(message.replace(/\n+$/, ""));

  }

  dumpMiners() {
    this.miners.forEach((miner) => {
      console.log(miner.name);
    });
  }

}   // class Server


class Miner {
  
  constructor (socket) {
    this.address = socket.remoteAddress;
    this.port    = socket.remotePort;
    this.name    = `${this.address}:${this.port}`;
    this.socket  = socket;
  }

  sendMessage (message) {
    this.socket.write(message);
  }


}
