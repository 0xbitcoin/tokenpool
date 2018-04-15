


const Tx = require('ethereumjs-tx')

var tokenContractJSON = require('../app/assets/contracts/_0xBitcoinToken.json');
var deployedContractInfo = require('../app/assets/contracts/DeployedContractInfo.json');
var web3Utils = require('web3-utils')
var cluster = require('cluster')


//var busySendingSolution = false;
//var queuedMiningSolutions = [];

//var queuedTokenTransfers = []; //keep trying if failed to mine or something
//var queuedTokenTransferCount = 0;
//var lastSubmittedMiningSolutionChallengeNumber;



//  var busySendingTransfer = false;


  var transactionCoordinator = require('./transaction-coordinator')

/**
BUG : pool is resending transactions!

**/




module.exports =  {


  async init(redisInterface, web3, accountConfig, poolConfig, pool_env )
  {

    this.redisInterface=redisInterface;
    this.web3=web3;
    this.pool_env = pool_env;
    this.poolConfig = poolConfig;
    this.accountConfig = accountConfig;
    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress())


    if (cluster.isMaster) {
      this.redisInterface.dropList("recent_challenges");
      // load up the list with 5 blank entries ... saves having to always check the size 
      // of the list later.
      this.redisInterface.pushToRedisList("recent_challenges", ["-", "-", "-", "-", "-"]);
    }


  //  this.difficultyTarget = 111;
    //this.challengeNumber = 1111;


  },

 async  update()
  {


      //reply ok
   transactionCoordinator.init(this.web3,this.tokenContract,this.poolConfig,this.accountConfig,this.redisInterface,this)


    var self=this;


    await self.collectTokenParameters();

     setInterval(function(){ self.collectTokenParameters()},2000);

    setTimeout(function(){ self.queueTokenTransfersForBalances()} , 0)


  },




  async getPoolChallengeNumber()
  {
    return await this.redisInterface.loadRedisData('challengeNumber');
  },

  async getPoolDifficultyTarget()
  {
     var targetString = await this.redisInterface.loadRedisData('miningTarget');
     return  targetString
  },

  async getPoolDifficulty()
  {
    return await this.redisInterface.loadRedisData('miningDifficulty');
  },


  async collectTokenParameters( )
  {


    var miningDifficultyString = await this.tokenContract.methods.getMiningDifficulty().call()  ;
    var miningDifficulty = parseInt(miningDifficultyString)

    var miningTargetString = await this.tokenContract.methods.getMiningTarget().call()  ;
    var miningTarget = web3Utils.toBN(miningTargetString)

    var challengeNumber = await this.tokenContract.methods.getChallengeNumber().call() ;




    // console.log('Mining difficulty:', miningDifficulty);
    // console.log('Mining target:', miningTargetString);
    if (challengeNumber != this.challengeNumber) {

      // check if we've seen this challenge before
      var seenBefore = await this.redisInterface.isElementInRedisList("recent_challenges", challengeNumber);
      if (!seenBefore) {
        this.challengeNumber = challengeNumber;
        console.log('New challenge:', challengeNumber);
        this.redisInterface.pushToRedisList("recent_challenges", challengeNumber);
        this.redisInterface.popLastFromRedisList("recent_challenges");
        this.redisInterface.storeRedisData('challengeNumber',challengeNumber)
      } else {
        console.log('Old challenge:', challengeNumber);
      }
    }



      this.miningDifficulty = miningDifficulty;
      this.difficultyTarget = miningTarget;

      this.redisInterface.storeRedisData('miningDifficulty',miningDifficulty)
      this.redisInterface.storeRedisData('miningTarget',   miningTarget.toString()  )


      var web3 = this.web3;
      var ethBlockNumber = await new Promise(function (fulfilled,error) {
            web3.eth.getBlockNumber(function(err, result)
          {
            if(err){error(err);return}
            console.log('eth block number ', result )
            fulfilled(result);
            return;
          });
       });


      this.redisInterface.storeRedisData('ethBlockNumber', ethBlockNumber )




  },


  async getEthBlockNumber()
  {
    var result = parseInt( await this.redisInterface.loadRedisData('ethBlockNumber' ));

    if(isNaN(result) || result < 1) result = 0 ;

    return result
  },

  getTokenContractAddress()
  {
    if(this.pool_env == 'test')
    {
      return deployedContractInfo.networks.testnet.contracts._0xbitcointoken.blockchain_address;
    }else if(this.pool_env == 'staging'){
      return deployedContractInfo.networks.staging.contracts._0xbitcointoken.blockchain_address;
    }else{
      return deployedContractInfo.networks.mainnet.contracts._0xbitcointoken.blockchain_address;
    }

  },



//use address from ?
  async queueMiningSolution( solution_number,minerEthAddress,challenge_digest,challenge_number )
  {

    var currentTokenMiningReward = await this.requestCurrentTokenMiningReward()


      var txData= {
          minerEthAddress: minerEthAddress,    //we use this differently in the pool!
          solution_number: solution_number,
          challenge_digest: challenge_digest,
          challenge_number: challenge_number,
          tokenReward: currentTokenMiningReward
        }

        await transactionCoordinator.addTransactionToQueue('solution',txData)

  },

//minerEthAddress
  async queueTokenTransfer(addressTo, tokenAmount, balancePaymentId)
  {
    var txData= {

      addressTo:addressTo,
      tokenAmount:tokenAmount,
      balancePaymentId: balancePaymentId

    }


    await transactionCoordinator.addTransactionToQueue('transfer',txData)


  },





  async queueTokenTransfersForBalances()
  {

    var self = this ;


    var min_balance_for_transfer = this.poolConfig.minBalanceForTransfer; //this is in token-satoshis

    //for each miner


  var minerList =  await this.getMinerList()

    for(i in minerList) //reward each miner
    {
      var minerAddress = minerList[i];

       var minerData = await this.getMinerData(minerAddress)

       var miner_token_balance = minerData.tokenBalance;

       if(miner_token_balance > min_balance_for_transfer)
       {

         console.log('transfer tokens to   ' ,minerAddress)

         minerData.tokensAwarded += miner_token_balance;


         var blockNumber = await this.getEthBlockNumber();

         var balancePaymentData = {
           id: web3Utils.randomHex(32),
           minerAddress: minerAddress,
           previousTokenBalance: minerData.tokenBalance,
           newTokenBalance: 0,
           block: blockNumber
         }

         console.log('storing balance payment',('balance_payments:'+minerAddress.toString()) ,balancePaymentData )
         //balance_payments:#
         await this.redisInterface.pushToRedisList(('balance_payments:'+minerAddress.toString()), JSON.stringify(balancePaymentData)  )

         await this.redisInterface.storeRedisHashData( 'balance_payment',balancePaymentData.id , JSON.stringify(balancePaymentData)  )

         minerData.tokenBalance = 0;

         //should store queued xfers in REDIS instead and monitor them for pending/success

         //only do this from the dedicated payment monitor loop
         // this.queueTokenTransfer(minerAddress,miner_token_balance, balancePaymentData.id);

         this.saveMinerDataToRedis(minerAddress,minerData)

       }

    }

    //if balance is higher than this

    //drain their balance and send that many tokens to them


      setTimeout(function(){ self.queueTokenTransfersForBalances()} , 0)


  },

  async saveMinerDataToRedis(minerEthAddress, minerData)
  {
    this.redisInterface.storeRedisHashData("miner_data", minerEthAddress , JSON.stringify(minerData))

  },

  async getMinerData(minerEthAddress)
  {

    var minerDataJSON = await this.redisInterface.findHashInRedis("miner_data", minerEthAddress );

    return JSON.parse(minerDataJSON) ;

  },


  //copied from peer
  async getMinerList( )
  {
      var minerData = await this.redisInterface.getResultsOfKeyInRedis("miner_data" );

      return minerData;

  },




   async requestCurrentTokenMiningReward()
   {


     var self = this ;
     var reward_amount =  new Promise(function (fulfilled,error) {

       self.tokenContract.methods.getMiningReward().call(function(err, result){
          if(err){error(err);return;}

          fulfilled(result)

        });
      });



     return reward_amount;
   },






}
