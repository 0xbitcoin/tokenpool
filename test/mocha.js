

import chai from 'chai'
import ganache from 'ganache-cli'
import Web3 from 'web3' 
import fs from 'fs'

import FileUtils from '../lib/util/file-utils.js'

//const TokenContractJSON = require("./assets/contracts/build/_0xBitcoinToken.json")

const TokenContractJSON = FileUtils.readJsonFileSync('/test/assets/contracts/build/_0xBitcoinToken.json');

 
import ContractHelper from '../lib/util/contract-helper.js'

import PeerHelper from '../lib/util/peer-helper.js';
import TokenDataHelper from '../lib/util/token-data-helper.js';


import TestHelper from './TestHelper.js'

import TokenInterface from '../lib/token-interface.js';
 

import MongoInterface from '../lib/mongo-interface.js'
import Web3ApiHelper from '../lib/util/web3-api-helper.js'


const pool_env = 'test'

var assert = chai.assert;

var tokenContract 

var testPoolConfig 

var web3

var testMinerEthAddress  

var mongoInterface = new MongoInterface()

describe('Pool System', async function() {
  it('should deploy contract', async  function() {


    const provider = ganache.provider();
    provider.setMaxListeners(15);       // Suppress MaxListenersExceededWarning warning
      web3 = new Web3(provider);
    let accounts = await web3.eth.getAccounts();
    
    testMinerEthAddress = accounts[1]

  //  let compiledContractJSON = TokenContractJSON
    let deployment = await TestHelper.deployContract(web3, TokenContractJSON  )
   

    tokenContract = deployment.contract 

    

    //set up the pool config variable 
    testPoolConfig = {
      poolEnv:"test",

      "apiConfig":{
        "coinGeckoApiURL": "https://api.coingecko.com/api/v3/coins/oxbitcoin?localization=en&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false",
        "defiPulseApiKey": ""
      }, 

      mintingConfig:{
        maxSolutionGasPriceWei: 100, 
        poolTokenFee: 5,
        communityTokenFee: 2,
        web3Provider: ganache.provider() 
      },

      paymentsConfig:{
        maxTransferGasPriceWei: 96,
        minBalanceForTransfer: 1500000000,  
        rebroadcastPaymentWaitBlocks: 10,
        minPaymentsInBatch: 1,
        web3Provider: ganache.provider() 
      }
      

    }

  });


  it('should read challenge number from contract ', async ( ) => {

    let challengeNumber = await tokenContract.methods.challengeNumber().call()
    
    assert.isOk( challengeNumber );
  
    
  });

  it('should init mongo   ', async (   ) => {

    await mongoInterface.init( 'tokenpool_'.concat(pool_env))

    await mongoInterface.dropDatabase()
});



  it('should collect token params  ', async (   ) => {

     
      let tokenInterface = new TokenInterface(mongoInterface, testPoolConfig)

      assert.isOk( tokenInterface );

      //let miningTokenContract =  ContractHelper.getTokenContract( web3  )

      let results = await TokenDataHelper.collectTokenParameters(tokenContract,  web3,  mongoInterface)

      let ethBlockNumber = await TokenDataHelper.getEthBlockNumber(mongoInterface)

      assert.isOk( ethBlockNumber );

  });


  it('should stub DB Data ', async (   ) => {

    

    console.log('testMinerEthAddress', testMinerEthAddress)

    let newMinerData = PeerHelper.getDefaultMinerData( testMinerEthAddress )


    newMinerData.alltimeTokenBalance =  2500000000
    await mongoInterface.insertOne('minerData', newMinerData )

  });


  it('should queueTokenTransfersForBalances ', async (   ) => {
 
    let results = await TokenInterface.buildBalancePayments(mongoInterface,testPoolConfig)

    let firstMiner = results[0]

    assert.equal( firstMiner.tokenBalance, 0  );

  });

  it('should not crash on failed api call  ', async (   ) => {
 
    let results = await Web3ApiHelper.fetchAPIData(testPoolConfig, mongoInterface)

      console.log('api results',results)
    assert.equal( results , undefined );

  });

 
});