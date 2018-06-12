
const net = require('net');
const os = require('os');

var minerAccount = '0x2323232323232323232323232323232323232323';

// var HOST = '192.168.1.81';
// var HOST = '75.157.162.19';
var HOST = '127.0.0.1';
var PORT = 9192;

var client = new net.Socket();
client.setEncoding('utf8');

client.connect(PORT, HOST);

client.on('connect', function() {
   console.log('CONNECTED TO: ' + HOST + ':' + PORT);
   console.log('Local port:', client.localPort);

   // subscribe to work notifications
   var msg = {
      id : 1,
      method : 'mining.subscribe',
      params : [minerAccount]
   };
   client.write(JSON.stringify(msg) + '\n');

   // send some shares to the pool every so often
   // setTimeout(submitShare, 5 * 1000);

}).on('data', function(jsonData) {
   // listen for :
   //    - mining.notify messages 
   //    - server responses to our subscribe msg and share submits

   var data = JSON.parse(jsonData);

   if (data.method == 'mining.notify') {
      console.log('mining.notify: challenge =', data.params[0].substring(0, 10), 
                  ', target =', data.params[1].substring(0,10),
                  ', difficulty =', data.params[2]);
   } else {
      console.log('DATA: ' + jsonData);
   }
   
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
         '500',
         '0x_challenge_number'
         ]
   };
   client.write(JSON.stringify(msg) + '\n');
}


