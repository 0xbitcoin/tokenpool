
const chai = require('chai')
const ganache = require('ganache-cli')
const Web3 = require('web3');
const fs = require("fs");

const TokenContractJSON = require("./assets/contracts/build/_0xBitcoinToken.json")

import TestHelper from './TestHelper'

var assert = chai.assert;

var tokenContract 

describe('Pool System', async function() {
  it('should deploy contract', async  function() {


    const provider = ganache.provider();
    provider.setMaxListeners(15);       // Suppress MaxListenersExceededWarning warning
    const web3 = new Web3(provider);
    let accounts = await web3.eth.getAccounts();



  //  let compiledContractJSON = TokenContractJSON
    let deployment = await TestHelper.deployContract(web3, TokenContractJSON  )
    console.log('deployed! ', deployment)


    tokenContract = deployment.contract 

     


  });


  it('should read challenge number from contract ', async  function() {

    let challengeNumber = await tokenContract.methods.challengeNumber().call()
    
    assert.isOk( challengeNumber );
     

  });
});