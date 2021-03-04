
const chai = require('chai')
const ganache = require('ganache-cli')
const Web3 = require('web3');
const fs = require("fs");

const TokenContractJSON = require("./assets/contracts/build/_0xBitcoinToken.json")


const ContractHelper = require('../lib/util/contract-helper.js')


import PeerHelper from '../lib/util/peer-helper';
import TokenDataHelper from '../lib/util/token-data-helper';


import TestHelper from './TestHelper'

import TokenInterface from '../lib/token-interface';
var mongoInterface = require('../lib/mongo-interface')




const pool_env = 'test'

var assert = chai.assert;

var tokenContract 

var testPoolConfig 

var web3

var testMinerEthAddress  

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

    

    let results = await TokenInterface.queueTokenTransfersForBalances(mongoInterface,testPoolConfig)

    let firstMiner = results[0]

    assert.equal( firstMiner.tokenBalance, 0  );

  });

 
});