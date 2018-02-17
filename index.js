
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

console.log('init');

fs = require('fs');

var Web3 = require('web3')

var web3 = new Web3();
web3.setProvider(INFURA_ROPSTEN_URL);

console.log('web3', web3);

init(web3);


async function init(web3)
{
  initJSONRPCServer();



}

async function initJSONRPCServer()
   {

     var jayson = require('jayson');

     console.log('listening on JSONRPC server localhost:4040')
       // create a server
       var server = jayson.server({
         getShareDifficulty: function(args, callback) {

           if(punkOwnersCollected == false )
           {
             callback(null, 'notSynced');
           }


           var punk_id = args[0];
           var punk_owner_address = punkOwners[punk_id];
           callback(null, punk_owner_address);


         }
       });

       server.http().listen(8586);

   }
