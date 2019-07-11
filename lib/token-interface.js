


const Tx = require('ethereumjs-tx')

var tokenContractJSON = require('../app/assets/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../app/assets/contracts/MintHelper.json');
var miningKingContractJSON = require('../app/assets/contracts/MiningKing.json');

var deployedContractInfo = require('../app/assets/contracts/DeployedContractInfo.json');
var web3Utils = require('web3-utils')
var cluster = require('cluster')


//var busySendingSolution = false;
//var queuedMiningSolutions = [];

//var queuedTokenTransfers = []; //keep trying if failed to mine or something
//var queuedTokenTransferCount = 0;
//var lastSubmittedMiningSolutionChallengeNumber;



//  var busySendingTransfer = false;



const ContractHelper = require('./util/contract-helper.js')

  const poolConfig = require('../pool.config').config;

  var transactionCoordinator = require('./transaction-coordinator');

/**

**/




module.exports =  {


  async init(redisInterface, mongoInterface, web3, accountConfig,   pool_env )
  {

    this.redisInterface=redisInterface;
    this.mongoInterface=mongoInterface;
    this.web3=web3;
    this.pool_env = pool_env;

    this.accountConfig = accountConfig;

    this.tokenContract = ContractHelper.getTokenContract(this.web3,this.pool_env)

    //this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress())

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
   transactionCoordinator.init(this.web3,this.pool_env, this.redisInterface,this.mongoInterface )

   transactionCoordinator.update();

    var self=this;


    await self.collectTokenParameters();

     setInterval(function(){ self.collectTokenParameters()},2000);

    // setTimeout(function(){ self.transferMinimumTokensToPayoutWallet()} , 1000)


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
  async queueTokenTransfer(addressFromType, addressTo, tokenAmount, balancePaymentId)
  {
    var txData= {
      addressFromType: addressFromType,  //payment or minting
      addressTo:addressTo,
      tokenAmount:tokenAmount,
      balancePaymentId: balancePaymentId
    }


    await transactionCoordinator.addTransactionToQueue('transfer',txData)


  },




  /*
    Every so often, check to make sure that the payouts wallet has enough tokens.
    If not, send it some from the mint wallet
    */
    //DEPRECATED
    async transferMinimumTokensToPayoutWallet()
    {



      var minPayoutWalletBalance = poolConfig.payoutWalletMinimum; //this is in token-satoshis

      if(minPayoutWalletBalance == null)
      {
        minPayoutWalletBalance = 1000*100000000;
      }

      var payoutWalletAddress =  this.getPaymentAccount().address;
      var mintingWalletAddress =  this.getMintingAccount().address;

      var payoutWalletBalance = await this.getTokenBalanceOf(payoutWalletAddress)
      var mintingWalletBalance = await this.getTokenBalanceOf(mintingWalletAddress)

      var balancePaymentId = web3Utils.randomHex(32);


      if( payoutWalletBalance < minPayoutWalletBalance
      && mintingWalletBalance >= minPayoutWalletBalance )
      {


        //queue a new transfer from the minting wallet to the payout wallet
          await this.queueTokenTransfer('minting', payoutWalletAddress, minPayoutWalletBalance, balancePaymentId)

      }


      var self = this;
      setTimeout(function(){ self.transferMinimumTokensToPayoutWallet()}, 5*60*1000) //every five minutes



    },


    async getTokenBalanceOf(address)
    {
      var walletBalance= await this.tokenContract.methods.balanceOf(address).call()  ;

      return walletBalance;
    },





  async queueTokenTransfersForBalances()
  {
    console.log('queueTokenTransfersForBalances')
    var self = this ;


    var min_balance_for_transfer = poolConfig.minBalanceForTransfer; //this is in token-satoshis

    //for each miner


  var minerList =  await this.getMinerList()

    for(i in minerList) //reward each miner
    {
      var minerAddress = minerList[i];

       var minerData = await this.getMinerData(minerAddress)

      // var miner_token_balance = minerData.tokenBalance;

       var num_tokens_owed = 0;
       if( minerData.alltimeTokenBalance > 0 && minerData.alltimeTokenBalance > minerData.tokensAwarded)
       {
          var num_tokens_owed = Math.floor(minerData.alltimeTokenBalance - minerData.tokensAwarded);
       }


       if(num_tokens_owed > min_balance_for_transfer)
       {

         console.log('transfer tokens to   ' ,minerAddress)

         minerData.tokensAwarded += num_tokens_owed;


         var blockNumber = await this.getEthBlockNumber();

         var balancePaymentData = {
           id: web3Utils.randomHex(32),
           minerAddress: minerAddress,
           previousTokenBalance: minerData.tokenBalance, //not used
           newTokenBalance: 0,
           amountToPay: num_tokens_owed,
           block: blockNumber
         }

         console.log('storing balance payment',('balance_payments:'+minerAddress.toString().toLowerCase()) ,balancePaymentData )

         //this redis list is no longer used
         await this.redisInterface.pushToRedisList(('balance_payments:'+minerAddress.toString().toLowerCase()), JSON.stringify(balancePaymentData)  )


         //not used
         await this.redisInterface.storeRedisHashData( 'balance_payment',balancePaymentData.id , JSON.stringify(balancePaymentData)  )

         await this.mongoInterface.upsertOne('balance_payment',{id: balancePaymentData.id} ,  balancePaymentData   ) //should be handled by batching

         minerData.tokenBalance = 0;

         //should store queued xfers in REDIS instead and monitor them for pending/success

         //only do this from the dedicated payment monitor loop
         // this.queueTokenTransfer(minerAddress,miner_token_balance, balancePaymentData.id);

         this.saveMinerDataToRedisMongo(minerAddress,minerData)

       }

    }

    //if balance is higher than this

    //drain their balance and send that many tokens to them


      setTimeout(function(){ self.queueTokenTransfersForBalances()} , 20 * 1000)


  },

  async saveMinerDataToRedisMongo(minerEthAddress, minerData)
  {

    if(minerEthAddress == null) return;

    minerEthAddress = minerEthAddress.toString().toLowerCase()

    await this.redisInterface.storeRedisHashData("miner_data_downcase", minerEthAddress , JSON.stringify(minerData))

    await this.mongoInterface.upsertOne("miner_data_downcase",{minerEthAddress: minerEthAddress},minerData)

  },

  async getMinerData(minerEthAddress)
  {

    if(minerEthAddress == null) return;

    minerEthAddress = minerEthAddress.toString().toLowerCase()

  //  var minerDataJSON = await this.redisInterface.findHashInRedis("miner_data_downcase", minerEthAddress );

    var minerData  = await this.mongoInterface.findOne("miner_data_downcase", {minerEthAddress: minerEthAddress} );


    return  minerData  ;

  },


  //copied from peer
  async getMinerList( )
  {
      var minerData = await this.redisInterface.getResultsOfKeyInRedis("miner_data_downcase" );

      return minerData;

  },


  getTransactionCoordinator()
  {
      return transactionCoordinator;
  },


  getTokenContract()
  {
      return this.tokenContract;
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



   getMintingAccount()
   {
     return this.accountConfig.minting;
   },

   getPaymentAccount()
   {
     return this.accountConfig.payment;
   }




}
