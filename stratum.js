

var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

var redisInterface = require('./lib/redis-interface')
var StratumServer = require('./lib/stratum-server')

var accountConfig;

var pool_env = 'production';

if( process.argv[2] == "test" )
{
  pool_env = 'test'
}

if( process.argv[2] == "staging" )
{
  pool_env = 'staging'
}

const poolConfig = require('./pool.config').config

var specified_web3 = poolConfig.web3provider;

if (pool_env == "test") {
   console.log("Using test mode!!! - Ropsten ")
   specified_web3 = specified_web3 || INFURA_ROPSTEN_URL;
   accountConfig = require('./test.account.config').accounts;
} else if (pool_env == "staging") {
    console.log("Using staging mode!!! - Mainnet ")
    specified_web3 = specified_web3 || INFURA_MAINNET_URL;
   accountConfig = require('./account.config').accounts;
} else {
    specified_web3 = specified_web3 || INFURA_MAINNET_URL;
    accountConfig = require('./account.config').accounts;
}

// web3.setProvider(specified_web3)
// console.log('using web3', specified_web3)

init();

async function init()
{
   await redisInterface.init()
   var stratumServer = new StratumServer(accountConfig, redisInterface);
   stratumServer.start();
}
