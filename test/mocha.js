
const chai = require('chai')
const ganache = require('ganache-cli')
const Web3 = require('web3');
const fs = require("fs");

const TokenContractJSON = require("./assets/contracts/build/_0xBitcoinToken.json")

import TestHelper from './TestHelper'

var assert = chai.assert;

describe('Pool System', async function() {
  it('should deploy contract', async  function() {

  //  let compiledContractJSON = TokenContractJSON
    let contract = await TestHelper.deployContract( TokenContractJSON  )

  });
});