
var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/v3/244edbea5c684f28abebcff483b9a8b9';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/v3/244edbea5c684f28abebcff483b9a8b9';

const poolConfig = require('../pool.config').config;
var accountConfig = require('../test.account.config').account;


   var peerUtils = require('../lib/peer-utils')


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


  describe('Transaction Receipt', function() {
    it('should return a good receipt', async function() {

       web3.setProvider(INFURA_MAINNET_URL);

      var tx_hash = '0x95d5cb7f76e20af273ea31ad472b671974c404ddb1286ef330b5ae8a7a97361f';

      var receipt = await web3.eth.getTransactionReceipt(tx_hash);
      console.log(receipt)
      assert.ok(receipt) ;



    });
  });


  describe('Estimate Share Hashrate', function() {
    it('should return a good hashrate', async function() {

      var diff = web3utils.toBN(30000);

      assert.equal(peerInterface.getEstimatedShareHashrate(diff,50 ), 2516582400) ;

      var test_mode = true;
      web3.setProvider(INFURA_ROPSTEN_URL);


      redisInterface.init(null,null,null,'test') //specify env and care?
      peerInterface.init(web3,accountConfig,poolConfig,redisInterface,tokenInterface,test_mode)


      var testMinerAddress = "0x00000000000000000000000000000000";
      var shareData=  {
        block: 1000,
        nonce: 1,
        miner: testMinerAddress,
        difficulty: 50000,
        isSolution: false,
        hashRateEstimate: 2516582400,
        time: peerUtils.getTimeNowSeconds()-4000,
        timeToFind: 400  //helps estimate hashrate- look at recent shares
      };

      var shareData2=  {
        block: 1000,
        nonce: 1,
        miner: testMinerAddress,
        difficulty: 50000,
        isSolution: false,
        hashRateEstimate: 2516582400,
        time: peerUtils.getTimeNowSeconds()-3000,
        timeToFind: 4000  //helps estimate hashrate- look at recent shares
      };

      //fake data

      await redisInterface.dropList("miner_submitted_share:"+testMinerAddress.toString().toLowerCase())

      await redisInterface.pushToRedisList("miner_submitted_share:"+testMinerAddress.toString().toLowerCase(),  JSON.stringify(shareData))

      await redisInterface.pushToRedisList("miner_submitted_share:"+testMinerAddress.toString().toLowerCase(),  JSON.stringify(shareData2))


      var est = await peerInterface.estimateMinerHashrate(testMinerAddress);
      assert.equal(est, '419430400') ;

    });
  });

  describe('Estimate Miner Vardiff', function() {
   it('should return a good vardiff', async function() {






     var testMinerAddress = "0x00000000000000000000000000000000";
     var testMinerData = {varDiff:205 };

     var newVarDiff = await peerInterface.getUpdatedVarDiffForMiner(testMinerData,testMinerAddress)

     assert.equal(newVarDiff, 205) ;


   });
 });

  describe('Estimate Total Hashrate', function() {
   //await this.redisInterface.dropList('total_pool_hashrate')
 });


   describe('Format Token Quantity', function() {

     assert.equal(renderUtils.formatTokenQuantity(102312342), '1.02312342') ;



  });





});
