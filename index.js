
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';


var https_enabled = process.argv[2] === 'https';


const poolConfig = require('./pool.config').config;
const accountConfig = require('./account.config').account;

console.log(poolConfig)

console.log('init');

fs = require('fs');

var peerInterface = require('./lib/peer-interface')
var tokenInterface = require('./lib/token-interface')
var webServer = require('./lib/web-server')

var Web3 = require('web3')

var web3 = new Web3()

web3.setProvider(INFURA_MAINNET_URL)


init(web3);


async function init(web3)
{
  await tokenInterface.init(web3,accountConfig,poolConfig)
  await peerInterface.init(accountConfig,poolConfig,tokenInterface) //initJSONRPCServer();

  webServer.init(https_enabled)

}
