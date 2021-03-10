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

import  fs from 'fs' 

const poolConfig = require('./pool.config')[pool_env]

console.log('poolConfig',poolConfig)

console.log('init');



//var redisInterface = require('./lib/redis-interface')
var mongoInterface = require('./lib/mongo-interface')

 
import PeerInterface from './lib/peer-interface.js';
import TokenInterface from './lib/token-interface.js';

import Web3ApiHelper from './lib/util/web3-api-helper.js';
import PoolStatsHelper from  './lib/util/pool-stats-helper.js'  
import  webServer from './lib/web-server.js' 

import diagnosticsManager from './lib/diagnostics-manager.js' 
 
var accountConfig;
 
import Web3 from 'web3'


const Cabin = require('cabin'); 
const Bree = require('bree');

const bree = new Bree({
   
  //logger: new Cabin(),

   
  jobs: [
   /* // runs `./jobs/foo.js` on start
    'foo',

    // runs `./jobs/foo-bar.js` on start
    {
      name: 'foo-bar'
    },

    // runs `./jobs/some-other-path.js` on start
    {
      name: 'beep',
      path: path.join(__dirname, 'jobs', 'some-other-path')
    },

 

    // runs `./jobs/worker-5.js` on after 10 minutes have elapsed
    {
      name: 'worker-5',
      timeout: '10m'
    },*/

    // runs `./jobs/collectTokenParameters.js` after 1 minute and every 5 minutes thereafter
    {
      name: 'collectTokenParameters',
      timeout: '2s',
      interval: '20s',
      worker: {
        workerData: {
          pool_env: pool_env 
        }
      }
      // this is unnecessary but shows you can pass a Number (ms)
      // interval: ms('5m')
    } 
 
    
  ]
});

 

init( );


async function init( )
{


        // Code to run if we're in the master process
      
  
         
     
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

           bree.start();





           let peerInterface = new PeerInterface(mongoInterface, poolConfig) 

              peerInterface.update();
              peerInterface.listenForJSONRPC();


 



}
