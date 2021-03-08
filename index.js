
//var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/v3/';
//var INFURA_MAINNET_URL = 'https://mainnet.infura.io/v3/';


var https_enabled = process.argv[2] === 'https';
var pool_env = 'production';

 
if( process.argv[2] == "staging" )
{
  pool_env = 'staging'
}

var cluster = require('cluster')

const poolConfig = require('./pool.config')[pool_env]

console.log('poolConfig',poolConfig)

console.log('init');

var fs = require('fs');

//var redisInterface = require('./lib/redis-interface')
var mongoInterface = require('./lib/mongo-interface')

 
import PeerInterface from './lib/peer-interface';
import TokenInterface from './lib/token-interface';

import Web3ApiHelper from './lib/util/web3-api-helper';
import PoolStatsHelper from  './lib/util/pool-stats-helper'  
var webServer =  require('./lib/web-server')

var diagnosticsManager =  require('./lib/diagnostics-manager')
 
var accountConfig;
var Web3 = require('web3')



//var mintingWeb3 = new Web3(poolConfig.mintingConfig.web3Provider)
//var paymentsWeb3 = new Web3(poolConfig.paymentsConfig.web3Provider)

var mongoInitParam;

/*
var specified_web3 = poolConfig.web3provider;

 if(specified_web3 != null)
 {
   web3.setProvider(specified_web3)
   console.log('using web3',specified_web3)
 }

if(pool_env == "test"){
  console.log("Using test mode!!! - Ropsten ")
  mongoInitParam = 'testdb'
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
*/

init( );


async function init( )
{


        // Code to run if we're in the master process
      if (cluster.isMaster) {

          // Count the machine's CPUs
        //  var cpuCount = require('os').cpus().length;

          // Create a worker for each CPU
          for (var i = 0; i < 2; i += 1) {
              cluster.fork();
          }


          //primary and webserver

          // await redisInterface.init()
        
          // web3apihelper.init( pool_env )

           //await webInterface.init(web3,accountConfig,poolConfig,mongoInterface,pool_env)
     //      await tokenInterface.init(mongoInterface,web3,accountConfig,pool_env, web3apihelper)
     //      await peerInterface.init(web3,accountConfig,mongoInterface,tokenInterface,pool_env) //initJSONRPCServer();
        
     
            await mongoInterface.init( 'tokenpool_'.concat(pool_env))


           await diagnosticsManager.init(mongoInterface)

           await webServer.init(https_enabled,poolConfig,mongoInterface)
           diagnosticsManager.update()

      // Code to run if we're in a worker process
      } else {
        var worker_id = cluster.worker.id


            if(worker_id == 1)  //updater
            {
              // await redisInterface.init()
               await mongoInterface.init( 'tokenpool_'.concat(pool_env))

               let web3apihelper = new Web3ApiHelper(mongoInterface, poolConfig)

               let tokenInterface = new TokenInterface(mongoInterface, poolConfig)
              // await peerInterface.init(web3,accountConfig,mongoInterface,tokenInterface,pool_env) //initJSONRPCServer();
               tokenInterface.update();
               
               web3apihelper.update()  //fetch API data 
            }
            if(worker_id == 2)  //jsonlistener
            {
              //await redisInterface.init()
              await mongoInterface.init( 'tokenpool_'.concat(pool_env))


              // web3apihelper.init(pool_env)

            //  await tokenInterface.init(mongoInterface,web3,accountConfig,pool_env, web3apihelper)
             // await peerInterface.init( mongoInterface,  poolConfig ) //initJSONRPCServer();
              //tokenInterface.update();
              let peerInterface = new PeerInterface(mongoInterface, poolConfig) 

              peerInterface.update();
              peerInterface.listenForJSONRPC();
            }
      }





}
