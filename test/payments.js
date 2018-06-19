
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

const poolConfig = require('../pool.config').config;
var accountConfig = require('../test.account.config').account;



var renderUtils = require('../app/assets/javascripts/render-utils')

var tokenInterface = require('../lib/token-interface')
var peerInterface = require('../lib/peer-interface')
var redisInterface = require('../lib/redis-interface')
var mongoInterface = require('../lib/mongo-interface')
var web3utils =  require('web3-utils');
var Web3 = require('web3')
var web3 = new Web3()


var assert = require('assert');
describe('Peer Interface', function() {


  describe('Balance Payments', function() {
    it('should  ', async function() {


       await mongoInterface.init('testdb')

       try{
          await mongoInterface.dropCollection('balance_payment');
        }catch(e)
        {
          console.error(e)
        }


      var balancePaymentData = {
        id: web3utils.randomHex(32),
        minerAddress: '0xAddress',
        previousTokenBalance: 1,
        newTokenBalance: 0,
        block: 1000
      }

      await mongoInterface.upsertOne('balance_payment',{id: balancePaymentData.id},  balancePaymentData  )

      console.log('meeep ')

       web3.setProvider(INFURA_ROPSTEN_URL);

       //add some fake balance payments

       //make sure they get batched


    /*  var tx_hash = '0x95d5cb7f76e20af273ea31ad472b671974c404ddb1286ef330b5ae8a7a97361f';

      var receipt = await web3.eth.getTransactionReceipt(tx_hash);
      console.log(receipt)
      assert.ok(receipt) ;
    */


    });
  });









});
