


//const Tx = require('ethereumjs-tx') ///handle this like the updated coinpurse.cc relay  code 

import PeerHelper from './util/peer-helper.js';
import TokenDataHelper from './util/token-data-helper.js';


import LoggingHelper from './util/logging-helper.js'

import TransactionCoordinator from './transaction-coordinator.js' 
  
 import web3Utils from 'web3-utils'

const COLLECT_TOKEN_DATA_PERIOD = 30 * 1000;

import  cron from 'node-cron' 
import ContractHelper from './util/contract-helper.js'
import Web3 from 'web3'
 
/**

**/




export default class TokenInterface {
  
  constructor( mongoInterface, poolConfig  ){
    this.mongoInterface=mongoInterface;
    this.poolConfig = poolConfig;

    this.web3 = new Web3(poolConfig.mintingConfig.web3Provider);
   
    //this.init()
  }

  /*async init(){
   
  }*/

 



 async  update()
  {


      
   let transactionCoordinator = new TransactionCoordinator(this.web3,this.poolConfig,  this.mongoInterface  )

   transactionCoordinator.update();

    
   
    const tokenContract = await ContractHelper.getTokenContract( this.web3 , this.poolConfig  )  

 
    //every 20 seconds
    cron.schedule('*/20 * * * * *', async function() {
      

    
      await TokenDataHelper.collectTokenParameters( tokenContract,  this.web3,  this.mongoInterface) 
   

    }.bind(this));


    //every 2 minutes
    cron.schedule('*/2 * * * *', async function() {
      
      
      await TokenDataHelper.collectPoolAccountBalances(  this.poolConfig,  this.mongoInterface) 
  

    }.bind(this));




    setInterval(function(){ TokenInterface.buildBalancePayments(this.mongoInterface,this.poolConfig)}.bind(this) , 5*1000)
    
    setInterval(function(){ TokenInterface.buildBatchedPaymentTransactions(this.mongoInterface,this.poolConfig)}.bind(this) , 5*1000)
  
    setInterval(function(){ TokenInterface.updateBatchedPaymentTransactions(this.mongoInterface,this.poolConfig)}.bind(this) , 5*1000)

    await TokenDataHelper.collectTokenParameters( tokenContract,  this.web3,  this.mongoInterface) 
    await TokenDataHelper.collectPoolAccountBalances(  this.poolConfig,  this.mongoInterface) 
  
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
 static async buildBalancePayments(mongoInterface, poolConfig )
  { 
    var enablePayPerShare = poolConfig.paymentsConfig.enablePPS;  
    if(enablePayPerShare == false){
 
      LoggingHelper.appendLog('WARN: Not building PPS balance payments since `enablePPS`==false in PaymentsConfig.', LoggingHelper.TYPECODES.WARN, mongoInterface)

    }

 

    LoggingHelper.appendLog('buildBalancePayments', LoggingHelper.TYPECODES.GENERIC, mongoInterface)


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

       

         minerData.tokensAwarded += num_tokens_owed;


         var blockNumber = await TokenDataHelper.getEthBlockNumber(mongoInterface);

         var balancePaymentData = {
           //id: web3Utils.randomHex(32),
           minerEthAddress: minerAddress,
           //previousTokenBalance: minerData.tokenBalance, //not used
           //newTokenBalance: 0,
           amountToPay: num_tokens_owed,
           block: blockNumber,

           batchedPaymentUuid: undefined,
           txHash: undefined
         }
 
         LoggingHelper.appendLog( [ 'storing balance payment',('balance_payments:'+minerAddress.toString().toLowerCase()) ,balancePaymentData ], LoggingHelper.TYPECODES.GENERIC, mongoInterface)


         //store balance payment in mongo
         await mongoInterface.insertOne('balance_payments',  balancePaymentData   ) //should be handled by batching

         minerData.tokenBalance = 0;

         //should store queued xfers in REDIS instead and monitor them for pending/success

         //only do this from the dedicated payment monitor loop
         // this.queueTokenTransfer(minerAddress,miner_token_balance, balancePaymentData.id);

         let savedMinerData = await PeerHelper.saveMinerDataToRedisMongo(minerAddress,minerData, mongoInterface)
         
         
       } 

    }

      return minerList

  } 

  static async buildBatchedPaymentTransactions(mongoInterface, poolConfig )
  {
     
    
    
    var min_payments_in_batch = poolConfig.paymentsConfig.minPaymentsInBatch;  
 
    let unbatchedBalancePayments = await mongoInterface.findAll('balance_payments',{batchedPaymentUuid:undefined})

     
    if(!unbatchedBalancePayments 
      || unbatchedBalancePayments.length < min_payments_in_batch){return} 

    
    let newBatchedPaymentTxData = { uuid: web3Utils.randomHex(32) , payments:[]}  
   

    const MAX_TX_IN_BATCH = 25 

    for(let balancePayment of unbatchedBalancePayments.slice(0,MAX_TX_IN_BATCH)){

      const ValidAddressLength = 42

      let addressSubstring = balancePayments.minerEthAddress.toString().substring(0,ValidAddressLength)

      if(web3Utils.isAddress( addressSubstring ) ){

        newBatchedPaymentTxData.payments.push({
          minerEthAddress: addressSubstring,
          amountToPay: balancePayment.amountToPay
        })

      }else{
        LoggingHelper.appendLog(['cannot pay to invalid address',balancePayment.minerEthAddress], LoggingHelper.TYPECODES.WARN, mongoInterface)
      }

     

      await mongoInterface.updateOne('balance_payments',
           {_id: balancePayment._id}, {batchedPaymentUuid: newBatchedPaymentTxData.uuid} )

    }

   // await mongoInterface.insertOne('transactions',newBatchedPaymentTransaction )
   await TransactionCoordinator.addTransactionToQueue('batched_payment', newBatchedPaymentTxData ,  mongoInterface, poolConfig)


  }



  /*
  This is not working properly 

  */

  static async updateBatchedPaymentTransactions(mongoInterface, poolConfig )
  { 
    LoggingHelper.appendLog('updateBatchedPaymentTransactions', LoggingHelper.TYPECODES.GENERIC, mongoInterface)

     
    
    let pendingBalancePayments = await mongoInterface.findAll('balance_payments',
          {batchedPaymentUuid: { $exists: true } , txHash: null })
 
    for(let pendingBalancePayment of pendingBalancePayments){

      if(!pendingBalancePayment.batchedPaymentUuid){
        return;
      }

    
      let matchingTransaction = await mongoInterface.findOne('transactions', {"txType": "batched_payment", "txData.uuid": pendingBalancePayment.batchedPaymentUuid    } )

      
      if(matchingTransaction && matchingTransaction.txHash){
 
        await mongoInterface.updateOne('balance_payments',{_id: pendingBalancePayment._id}, {txHash: matchingTransaction.txHash} )

      }



    }
 
   

  }


}
