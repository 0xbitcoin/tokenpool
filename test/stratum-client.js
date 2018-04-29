
var net = require('net');

var HOST = '127.0.0.1';
var PORT = 5000;

var client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    var msg = {
    	id : 1,
	    method : 'mining.subscribe',
	    params : ['0x1234']
    };
    client.write(JSON.stringify(msg) + '\n');
});

client.on('data', function(data) {
    console.log('DATA: ' + data);
});

client.on('close', function() {
    console.log('Connection closed');
});
