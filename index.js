
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

console.log('init');

fs = require('fs');

var peerInterface = require('./lib/peer-interface')
var tokenInterface = require('./lib/token-interface')
var webServer = require('./lib/web-server')

var Web3 = require('web3')

var web3 = new Web3();
web3.setProvider(INFURA_ROPSTEN_URL);

console.log('web3', web3);

init(web3);


async function init(web3)
{
  peerInterface.init() //initJSONRPCServer();
  tokenInterface.init(web3)
  webServer.init()

}
