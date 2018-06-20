
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

const poolConfig = require('../pool.config').config;
var accountConfig = require('../test.account.config').accounts;



var renderUtils = require('../app/assets/javascripts/render-utils')

var tokenInterface = require('../lib/token-interface')
var peerInterface = require('../lib/peer-interface')
var redisInterface = require('../lib/redis-interface')
var mongoInterface = require('../lib/mongo-interface')
var web3utils =  require('web3-utils');
var Web3 = require('web3')
var web3 = new Web3()
 var pool_env = 'test'


var transactionCoordinator;

var NUM_PAYMENTS = 1;

var assert = require('assert');
describe('Peer Interface', function() {


  describe('Balance Payments', function() {
    it('can batch payments  ', async function() {


       web3.setProvider(INFURA_ROPSTEN_URL);


       await redisInterface.init()

       await mongoInterface.init('testdb')

       try{
          await mongoInterface.dropCollection('balance_payment');
      }catch(e)
      {
        console.error(e)
      }

      try{
         await mongoInterface.dropCollection('payment_batch');
     }catch(e)
     {
       console.error(e)
     }

      var minerEthAddress = '0xB11ca87E32075817C82Cc471994943a4290f4a14'


      for(var i=0;i<NUM_PAYMENTS;i++)
      {

        var balancePaymentData = {
          id: web3utils.randomHex(32),
          minerAddress: minerEthAddress.toLowerCase(),
          previousTokenBalance: 1000,
          newTokenBalance: 0,
          block: 1000
        }
        console.log( balancePaymentData )

        var upsert = await mongoInterface.upsertOne('balance_payment',{id: balancePaymentData.id},  balancePaymentData  )
        assert.ok(upsert) ;

      }


      await tokenInterface.init(redisInterface,mongoInterface,web3,accountConfig,poolConfig,pool_env)
        transactionCoordinator = tokenInterface.getTransactionCoordinator();

        var tokenContract = tokenInterface.getTokenContract()

      transactionCoordinator.init(web3,tokenContract,poolConfig,accountConfig,redisInterface,mongoInterface,tokenInterface,pool_env)

      //Make sure the 5 tx batch
      var unbatched_pmnts = await mongoInterface.findAll('balance_payment',{batchId: undefined})

        assert.equal(unbatched_pmnts.length,NUM_PAYMENTS);

      var result = await transactionCoordinator.batchMinedPayments(unbatched_pmnts)

      assert.equal(result.success,true);
      assert.equal(result.batchedPayments,NUM_PAYMENTS);


       //Make sure batching again does nothing
     var unbatched_pmnts = await mongoInterface.findAll('balance_payment',{batchId: undefined})

     var result = await transactionCoordinator.batchMinedPayments(unbatched_pmnts)

     assert.equal(result.success,true);
     assert.equal(result.batchedPayments,0);

       //add some fake balance payments

       //make sure they get batched


        /*  var tx_hash = '0x95d5cb7f76e20af273ea31ad472b671974c404ddb1286ef330b5ae8a7a97361f';

          var receipt = await web3.eth.getTransactionReceipt(tx_hash);
          console.log(receipt)
          assert.ok(receipt) ;
        */


    });


      it('can monitor batch payments  ', async function() {
          var result = await transactionCoordinator.checkBatchPaymentsStatus( )

          assert.ok(result);

     });



     it('can broadcast batch payments  ', async function() {

         var result = await transactionCoordinator.broadcastPaymentBatches( )

         assert.ok(result.success);
         assert.equal(result.paymentsInBatch,NUM_PAYMENTS);


    });



  });









});
