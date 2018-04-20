
var net = require('net');

module.exports =  {


  async init()
  {
    var server = net.createServer();

    server.on('connection', function(socket) {
    
      console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);

      socket.on('data', function(data) {
          console.log('DATA ' + socket.remoteAddress + ': ' + data);
          socket.write('You said :' + data);
          
      });
      
      socket.on('close', function(data) {
          console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
      });
    
    });

    server.listen(5000, '127.0.0.1');

  },


}
