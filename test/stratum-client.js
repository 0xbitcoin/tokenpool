
const net = require('net');
const os = require('os');

var HOST = '127.0.0.1';
var PORT = 5000;

var client = new net.Socket();

client.connect(PORT, HOST);

client.on('connect', function() {
   console.log('CONNECTED TO: ' + HOST + ':' + PORT);

   // subscribe to work notifications
   var msg = {
      id : 1,
      method : 'mining.subscribe',
      params : ['0x_miner_eth_address']
   };
   client.write(JSON.stringify(msg) + '\n');

   // send some shares to the pool every so often
   // setInterval(submitShare, 10 * 1000);

}).on('data', function(data) {
   // listen for :
   //    - mining.notify messages 
   //    - server responses to our subscribe msg and share submits
   console.log('DATA: ' + data);
   
}).on('close', function() {
   console.log('Connection closed');
});


function submitShare() {
   console.log('submitting share');
   var msg = {
      id : 4,
      method : 'mining.submit',
      params : [
         '0x_nonce',
         '0x_miner_eth_address',
         '0x_digest',
         '123_difficulty',
         '0x_challenge'
         ]
   };
   client.write(JSON.stringify(msg) + '\n');
}


   var ipc=require('node-ipc');

   ipc.config.id   = 'hello';
   ipc.config.retry= 1500;
   ipc.config.silent = true;

   if (os.hostname() == 'desktop-pc') {
      ipc.myConnect = ipc.connectToNet;
   }
   else {
      ipc.myConnect = ipc.connect;
   }

   ipc.myConnect(
      'master',
      function(){
         ipc.of.master.on('connect', function() {
            console.log('## connected to master ##');
            ipc.of.master.emit('message', 'hello from statum client')
         });
         ipc.of.master.on('disconnect', function() {
            console.log('disconnected from master');
         });
         ipc.of.master.on('challengeNumber', function(data){
            console.log('New challenge :', data);
         });
      }
   );
