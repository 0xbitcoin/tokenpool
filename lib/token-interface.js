


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
    this.tokenContract = await ContractHelper.getTokenContract( this.web3 , this.poolConfig  )  
  }

 



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


    setInterval(function(){ TokenInterface.queueTokenTransfersForBalances(this.mongoInterface,this.poolConfig)}.bind(this) , 20*1000)


  } 



 
 


 
 static async queueMiningSolution(solution_number,minerEthAddress,challenge_digest,challenge_number , mongoInterface, poolConfig)
  {

    let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)


    var currentTokenMiningReward = recentMiningContractData.miningReward


      var txData= {
          minerEthAddress: minerEthAddress,    //we use this differently in the pool!
          solution_number: solution_number,
          challenge_digest: challenge_digest,
          challenge_number: challenge_number,
          tokenReward: currentTokenMiningReward
        }



        await TransactionCoordinator.addTransactionToQueue('solution', txData ,  mongoInterface, poolConfig)

  } 

//rebuild me 
 /* async queueTokenTransfer(addressFromType, addressTo, tokenAmount, balancePaymentId)
  {
    var txData= {
      addressFromType: addressFromType,  //payment or minting
      addressTo:addressTo,
      tokenAmount:tokenAmount,
      balancePaymentId: balancePaymentId
    }


    await TransactionCoordinator.addTransactionToQueue('transfer',txData)
 
  } */



 



//converted all time miner balance into tokens awarded and creates 'balance payment' records which will get batch-paid 
 static async queueTokenTransfersForBalances(mongoInterface, poolConfig )
  {
    console.log('queueTokenTransfersForBalances')
    
    var min_balance_for_transfer = poolConfig.paymentsConfig.minBalanceForTransfer; //this is in token-satoshis
 

  var minerList =  await PeerHelper.getMinerList(mongoInterface)
 

    for(let minerData of minerList) //reward each miner
    {
   
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

         let savedMinerData = await PeerHelper.saveMinerDataToRedisMongo(minerAddress,minerData, mongoInterface)
         //console.log('savedMinerData', savedMinerData)

         
       }

       

    }

    //if balance is higher than this

    //drain their balance and send that many tokens to them


      //setTimeout(function(){ this.queueTokenTransfersForBalances(mongoInterface, poolConfig)}.bind(this) , 20 * 1000)
      return minerList

  } 


 
 



}
