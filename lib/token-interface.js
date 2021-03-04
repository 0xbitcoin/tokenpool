


//const Tx = require('ethereumjs-tx') ///handle this like the updated coinpurse.cc relay  code 

import PeerHelper from './util/peer-helper';
import TokenDataHelper from './util/token-data-helper';

import TransactionCoordinator from './transaction-coordinator' 

var tokenContractJSON = require('../src/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../src/contracts/MintHelper.json');
 
var deployedContractInfo = require('../src/config/DeployedContractInfo.json');
var web3Utils = require('web3-utils')
var cluster = require('cluster')

const COLLECT_TOKEN_DATA_PERIOD = 30 * 1000;

 

//var busySendingSolution = false;
//var queuedMiningSolutions = [];

//var queuedTokenTransfers = []; //keep trying if failed to mine or something
//var queuedTokenTransferCount = 0;
//var lastSubmittedMiningSolutionChallengeNumber;



//  var busySendingTransfer = false;



const ContractHelper = require('./util/contract-helper.js')

//  const poolConfig = require('../pool.config').config;

 
const  Web3   = require('web3');

/**

**/




export default class TokenInterface {
  
  constructor( mongoInterface, poolConfig  ){
    this.mongoInterface=mongoInterface;
    this.poolConfig = poolConfig;

    this.web3 = new Web3(poolConfig.mintingConfig.web3Provider);
   
    this.init()
  }

  async init(){
    this.tokenContract = await ContractHelper.getTokenContract( this.web3  ) //FIX ME 
  }


///web3, accountConfig,   pool_env, web3apihelper
 /* init(  mongoInterface, poolConfig )
  {

    //this.redisInterface=redisInterface;
    this.mongoInterface=mongoInterface;
    this.poolConfig = poolConfig;

    this.web3 = new Web3(poolConfig.mintingConfig.web3Provider); //careful of this ! 
    //this.pool_env = pool_env;

    // this.web3apihelper = web3apihelper

    //this.accountConfig = accountConfig;

    this.tokenContract = ContractHelper.getTokenContract(this.web3 ) //FIX ME 

    //this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress())


    //change this -- no longer using redis 

      // load up the list with 5 blank entries ... saves having to always check the size
      // of the list later.
    if (cluster.isMaster) {
     // this.redisInterface.dropList("recent_challenges");
    
     // this.redisInterface.pushToRedisList("recent_challenges", ["-", "-", "-", "-", "-"]);
    }

 

  },*/

 async  update()
  {


      //reply ok
   let transactionCoordinator = new TransactionCoordinator(this.web3,this.poolConfig,  this.mongoInterface  )

   transactionCoordinator.update();

   


    //await this.collectTokenParameters();

     setInterval(function(){ TokenDataHelper.collectTokenParameters(this.tokenContract, this.web3, this.mongoInterface) }.bind(this),  COLLECT_TOKEN_DATA_PERIOD);

     //do one right away
     setTimeout(function(){ TokenDataHelper.collectTokenParameters(this.tokenContract, this.web3, this.mongoInterface) }.bind(this),  1000);

    // setTimeout(function(){ self.transferMinimumTokensToPayoutWallet()} , 1000)


    setInterval(function(){ TokenInterface.queueTokenTransfersForBalances(this.mongoInterface,this.poolConfig)}.bind(this) , 0)


  } 



/*
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
  },*/


//uses infura




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

  } 

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


  } 




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



    } 


    async getTokenBalanceOf(address)
    {
      var walletBalance= await this.tokenContract.methods.balanceOf(address).call()  ;

      return walletBalance;
    } 





 static async queueTokenTransfersForBalances(mongoInterface, poolConfig )
  {
    console.log('queueTokenTransfersForBalances')
   // var self = this ;


    var min_balance_for_transfer = poolConfig.paymentsConfig.minBalanceForTransfer; //this is in token-satoshis

    //for each miner


  var minerList =  await PeerHelper.getMinerList(mongoInterface)

   //console.log('minerList', minerList)

    for(let minerData of minerList) //reward each miner
    {
     // var minerAddress = minerList[i];

       //var minerData = await PeerHelper.getAdvancedMinerData(minerAddress, mongoInterface)

     // console.log('minerData', minerData)

      let minerAddress = minerData.minerEthAddress

      // var miner_token_balance = minerData.tokenBalance;

      if(typeof minerData.alltimeTokenBalance == 'undefined') minerData.alltimeTokenBalance = 0;
      if(typeof minerData.tokensAwarded == 'undefined') minerData.tokensAwarded = 0;


       var num_tokens_owed = 0;
       if( minerData.alltimeTokenBalance > 0 && minerData.alltimeTokenBalance > minerData.tokensAwarded)
       {
          var num_tokens_owed = Math.floor(minerData.alltimeTokenBalance - minerData.tokensAwarded);
       }


       //console.log('num_tokens_owed', num_tokens_owed, )

       if(typeof num_tokens_owed != 'undefined' && num_tokens_owed > min_balance_for_transfer)
       {

         console.log('transfer tokens to   ' ,minerAddress)

         minerData.tokensAwarded += num_tokens_owed;


         var blockNumber = await TokenDataHelper.getEthBlockNumber(mongoInterface);

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
       //  await this.redisInterface.pushToRedisList(('balance_payments:'+minerAddress.toString().toLowerCase()), JSON.stringify(balancePaymentData)  )
          //not used
        // await this.redisInterface.storeRedisHashData( 'balance_payment',balancePaymentData.id , JSON.stringify(balancePaymentData)  )


         //store balance payment in mongo
         await mongoInterface.upsertOne('balance_payment',{id: balancePaymentData.id} ,  balancePaymentData   ) //should be handled by batching

         minerData.tokenBalance = 0;

         //should store queued xfers in REDIS instead and monitor them for pending/success

         //only do this from the dedicated payment monitor loop
         // this.queueTokenTransfer(minerAddress,miner_token_balance, balancePaymentData.id);

         let savedMinerData = await TokenInterface.saveMinerDataToRedisMongo(minerAddress,minerData, mongoInterface)
         //console.log('savedMinerData', savedMinerData)

         
       }

       

    }

    //if balance is higher than this

    //drain their balance and send that many tokens to them


      //setTimeout(function(){ this.queueTokenTransfersForBalances(mongoInterface, poolConfig)}.bind(this) , 20 * 1000)
      return minerList

  } 

  static async saveMinerDataToRedisMongo(minerEthAddress, minerData, mongoInterface)
  {

    if(minerEthAddress == null) return;

    minerEthAddress = minerEthAddress.toString().toLowerCase()

    //await this.redisInterface.storeRedisHashData("miner_data_downcase", minerEthAddress , JSON.stringify(minerData))

    let result = await mongoInterface.upsertOne("minerData",{minerEthAddress: minerEthAddress},minerData)

    return result 
  } 

  

 


  getTransactionCoordinator()
  {
      return transactionCoordinator;
  } 


  getTokenContract()
  {
      return this.tokenContract;
   
  } 

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
   } 


/*
   getMintingAccount()
   {
     return this.accountConfig.minting;
   } 

   getPaymentAccount()
   {
     return this.accountConfig.payment;
   }
*/



}
