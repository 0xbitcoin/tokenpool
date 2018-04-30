
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';


var https_enabled = process.argv[2] === 'https';
var pool_env = 'production';

if( process.argv[2] == "test" )
{
  pool_env = 'test'
}

if( process.argv[2] == "staging" )
{
  pool_env = 'staging'
}

var cluster = require('cluster')

const poolConfig = require('./pool.config').config

// console.log(poolConfig)

// console.log('init');

fs = require('fs');

var redisInterface = require('./lib/redis-interface')
var peerInterface = require('./lib/peer-interface')
var tokenInterface = require('./lib/token-interface')
var webInterface = require('./lib/web-interface')
var webServer =  require('./lib/web-server')
var stratumServer = require('./lib/stratum-server')
var diagnosticsManager =  require('./lib/diagnostics-manager')
var ipc = require('node-ipc')
var accountConfig;
var Web3 = require('web3')

var web3 = new Web3()


var specified_web3 = poolConfig.web3provider;

 if(specified_web3 != null)
 {
   web3.setProvider(specified_web3)
   console.log('using web3',specified_web3)
 }

if(pool_env == "test"){
  console.log("Using test mode!!! - Ropsten ")
  if(specified_web3 == null)
  {
    web3.setProvider(INFURA_ROPSTEN_URL)
  }
   accountConfig = require('./test.account.config').accounts;
}else if(pool_env == "staging"){
    console.log("Using staging mode!!! - Mainnet ")
    if(specified_web3 == null)
    {
     web3.setProvider(INFURA_MAINNET_URL)
   }
   accountConfig = require('./account.config').accounts;
}else{
    if(specified_web3 == null)
    {
     web3.setProvider(INFURA_MAINNET_URL)
    }
   accountConfig = require('./account.config').accounts;
}

init(web3);


async function init(web3)
{


        // Code to run if we're in the master process
      if (cluster.isMaster) {

          // Count the machine's CPUs
        //  var cpuCount = require('os').cpus().length;

          // Create a worker for each CPU
          for (var i = 0; i < 2; i += 1) {
              cluster.fork();
          }


           await redisInterface.init()
           await webInterface.init(web3,accountConfig,poolConfig,redisInterface)
           await tokenInterface.init(redisInterface,web3,accountConfig,poolConfig,pool_env)
           await peerInterface.init(web3,accountConfig,poolConfig,redisInterface,tokenInterface,pool_env) //initJSONRPCServer();
           await diagnosticsManager.init(redisInterface,webInterface,peerInterface)

           await webServer.init(https_enabled,webInterface,peerInterface)
           await stratumServer.init();

           console.log("Web3 provider:", web3.currentProvider.host);

          // config ipc
          ipc.config.id   = 'master';
          ipc.config.retry = 1500;
          ipc.config.silent = true;
       
          ipc.serve();
          ipc.server.on('start', function() {
            ipc.server.on(
                'message',
                function(data,socket) {
                    console.log('got a message : ', data);
                    ipc.server.emit(socket, 'response', data + ' world!');
                }
            );
            ipc.server.on(
                'socket.disconnected',
                function(socket, destroyedSocketID) {
                    console.log('client ' + destroyedSocketID + ' has disconnected!');
            });
          });
       
          ipc.server.start();

          setInterval(function() {
            ipc.server.broadcast('multi-message', 'how is everybody doing?');
          }, 4000);

      // Code to run if we're in a worker process
      } else {
        var worker_id = cluster.worker.id


            if(worker_id == 1)
            {
               await redisInterface.init()
               await tokenInterface.init(redisInterface,web3,accountConfig,poolConfig,pool_env)


               await peerInterface.init(web3,accountConfig,poolConfig,redisInterface,tokenInterface,pool_env) //initJSONRPCServer();
               tokenInterface.update();
               peerInterface.update();
            }
            if(worker_id == 2)
            {
              await redisInterface.init()
              await tokenInterface.init(redisInterface,web3,accountConfig,poolConfig,pool_env)
              await peerInterface.init(web3,accountConfig,poolConfig,redisInterface,tokenInterface,pool_env) //initJSONRPCServer();
              //tokenInterface.update();
              peerInterface.listenForJSONRPC();
            }
      }





}
