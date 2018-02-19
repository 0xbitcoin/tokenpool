
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';


var https_enabled = process.argv[2] === 'https';
var test_mode = process.argv[2] === 'test';



const poolConfig = require('./pool.config').config

console.log(poolConfig)

console.log('init');

fs = require('fs');

var redisInterface = require('./lib/redis-interface')
var peerInterface = require('./lib/peer-interface')
var tokenInterface = require('./lib/token-interface')
var webServer = require('./lib/web-server')
var accountConfig;
var Web3 = require('web3')

var web3 = new Web3()

if(test_mode){
  console.log("Using test mode!!! - Ropsten ")
  web3.setProvider(INFURA_ROPSTEN_URL)

   accountConfig = require('./test.account.config').account;
}else{
  web3.setProvider(INFURA_MAINNET_URL)

   accountConfig = require('./account.config').account;
}


init(web3);


async function init(web3)
{
  await redisInterface.init()

  await tokenInterface.init(redisInterface,web3,accountConfig,poolConfig,test_mode)
  await peerInterface.init(accountConfig,poolConfig,redisInterface,tokenInterface,test_mode) //initJSONRPCServer();

  webServer.init(https_enabled,peerInterface)

}
