import  SegfaultHandler from  'segfault-handler' 
SegfaultHandler.registerHandler('crash.log');

//var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/v3/';
//var INFURA_MAINNET_URL = 'https://mainnet.infura.io/v3/';

var https_enabled = process.argv[2] === 'https';
var pool_env = 'production';

 
if( process.argv[2] == "staging" )
{
  pool_env = 'staging'
}
 

import FileUtils from './lib/util/file-utils.js'
import  cron from 'node-cron' 

let poolConfigFull = FileUtils.readJsonFileSync('/pool.config.json');
let poolConfig = poolConfigFull[pool_env]



console.log('poolConfig',poolConfig, poolConfigFull)

console.log('init');


 
import MongoInterface from './lib/mongo-interface.js'
 
import PeerInterface from './lib/peer-interface.js';
import TokenInterface from './lib/token-interface.js';

import Web3ApiHelper from './lib/util/web3-api-helper.js';
import PoolStatsHelper from  './lib/util/pool-stats-helper.js'  
import  WebServer from './lib/web-server.js' 

import DiagnosticsManager from './lib/diagnostics-manager.js' 
 

import ContractHelper from './lib/util/contract-helper.js'
import TokenDataHelper from './lib/util/token-data-helper.js'


var accountConfig;
 
import Web3 from 'web3'
 
 

init( );


async function init( )
{


        // Code to run if we're in the master process


           

           let mongoInterface = new MongoInterface()
           let diagnosticsManager = new DiagnosticsManager()
           let webServer = new WebServer()
     
           await mongoInterface.init( 'tokenpool_'.concat(pool_env))


           await diagnosticsManager.init(poolConfig, mongoInterface)

           await webServer.init(https_enabled,poolConfig,mongoInterface)
           diagnosticsManager.update()




           let web3apihelper = new Web3ApiHelper(mongoInterface, poolConfig)

           let tokenInterface = new TokenInterface(mongoInterface, poolConfig)
          // await peerInterface.init(web3,accountConfig,mongoInterface,tokenInterface,pool_env) //initJSONRPCServer();
         
                //This worker is dying !!!
           tokenInterface.update();
           
           web3apihelper.update()  //fetch API data 

           






           let peerInterface = new PeerInterface(mongoInterface, poolConfig) 

              peerInterface.update();
              peerInterface.listenForJSONRPC();


 



}
