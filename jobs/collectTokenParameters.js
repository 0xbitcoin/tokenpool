
 import { Worker, isMainThread, workerData } from 'worker_threads' 
 
 
import Web3 from 'web3'
 
import TokenDataHelper from '../lib/util/token-data-helper.js'

 import ContractHelper from '../lib/util/contract-helper.js'
 

import FileUtils from '../lib/util/file-utils.js'
 

 


var pool_env = 'staging';   
if( workerData!=null && workerData.pool_env == "production" )
{

  console.log("worker data",workerData.pool_env)

  pool_env = 'production'
}
 


let poolConfigFull = FileUtils.readJsonFileSync('/pool.config.json');
let poolConfig = poolConfigFull[pool_env]
 

import MongoInterface from '../lib/mongo-interface.js'
 


console.log('collect token params','poolenv',pool_env)
 


async function runTask( )
{   
    let mongoInterface = new MongoInterface()


    var web3 = new Web3(poolConfig.mintingConfig.web3Provider);

    await mongoInterface.init( 'tokenpool_'.concat(pool_env))

    let tokenContract = await ContractHelper.getTokenContract(  web3 ,  poolConfig  )  

    await TokenDataHelper.collectTokenParameters( tokenContract,  web3, mongoInterface) 

    console.log('finished task: collect token params')

    process.exit(0);
}



runTask( );