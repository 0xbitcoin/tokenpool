
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

describe('Pool System', async function() {
  it('should deploy contract', async  function() {


    const provider = ganache.provider();
    provider.setMaxListeners(15);       // Suppress MaxListenersExceededWarning warning
      web3 = new Web3(provider);
    let accounts = await web3.eth.getAccounts();
 

  //  let compiledContractJSON = TokenContractJSON
    let deployment = await TestHelper.deployContract(web3, TokenContractJSON  )
   

    tokenContract = deployment.contract 

    

    //set up the pool config variable 
    testPoolConfig = {

      mintingConfig:{
        "maxSolutionGasPriceWei": 100, 
        "poolTokenFee": 5,
        "communityTokenFee": 2,
         web3Provider: ganache.provider() 
      }
      

    }

  });


  it('should read challenge number from contract ', async ( ) => {

    let challengeNumber = await tokenContract.methods.challengeNumber().call()
    
    assert.isOk( challengeNumber );
  
    
  });

  it('should init token interface ', async (   ) => {

      await mongoInterface.init( 'tokenpool_'.concat(pool_env))

      let tokenInterface = new TokenInterface(mongoInterface, testPoolConfig)

      assert.isOk( tokenInterface );

      //let miningTokenContract =  ContractHelper.getTokenContract( web3  )

      let results = await TokenDataHelper.collectTokenParameters(tokenContract,  web3,  mongoInterface)




  });

});