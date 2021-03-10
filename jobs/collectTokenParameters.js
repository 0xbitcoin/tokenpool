
 const { Worker, isMainThread, workerData } = require('worker_threads');
 

const  Web3   = require('web3');

import TokenDataHelper from '../lib/util/token-data-helper'

 
const ContractHelper = require('../lib/util/contract-helper.js')


var pool_env = 'staging';   
if( workerData!=null && workerData.pool_env == "production" )
{

  console.log("worker data",workerData.pool_env)

  pool_env = 'production'
}
 

const poolConfig = require('../pool.config')[pool_env]
var mongoInterface = require('../lib/mongo-interface')



console.log('collect token params','poolenv',pool_env)
 


async function runTask( )
{

    var web3 = new Web3(poolConfig.mintingConfig.web3Provider);

    await mongoInterface.init( 'tokenpool_'.concat(pool_env))

    let tokenContract = await ContractHelper.getTokenContract(  web3 ,  poolConfig  )  

    await TokenDataHelper.collectTokenParameters( tokenContract,  web3, mongoInterface) 

    console.log('finished task: collect token params')

    process.exit(0);
}



runTask( );