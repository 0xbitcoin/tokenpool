

/*

Turns queued ethereum transaction into actual ones :)

Waits for pending TX to be mined before sending another !

Solutions are highest priority

*/
 
 
//const poolConfig = require('../pool.config').config
 
 
 //var TransactionHelper = new TransactionHelper();
 import TokenDataHelper from './util/token-data-helper.js'
 import TransactionHelper from './util/transaction-helper.js'

  import Web3 from 'web3'

  import ContractHelper from './util/contract-helper.js'
 
const PAYMENT_BROADCAST_PERIOD = 100 * 1000;

export default class TransactionCoordinator  {




  constructor(web3, poolConfig,   mongoInterface )
  {


    this.web3=web3;
     
    this.mongoInterface=mongoInterface;

  

    this.poolConfig=poolConfig;

    this.paymentContract = ContractHelper.getBatchedPaymentsContract(this.web3,this.poolConfig )
   

  } 

  async update()
  {

            setInterval(function(){this.updateTransactionStatistics(this.mongoInterface)}.bind(this),4000)
         

            //setTimeout(function(){self.broadcastQueuedPaymentTransactions()},0)
            setInterval(function(){this.broadcastQueuedMintTransactions(this.mongoInterface, this.poolConfig)}.bind(this),5000)
            setInterval(function(){this.broadcastQueuedBatchedPaymentTransactions(this.mongoInterface,this.poolConfig)}.bind(this),5000)
            setInterval(function(){this.requeueSkippedBatchedPaymentTransactions(this.mongoInterface,this.poolConfig)}.bind(this),5000)

            

           // setTimeout(function(){this.updateBroadcastedTransactionStatus(this.mongoInterface)}.bind(this),0)

            setInterval(function(){TransactionCoordinator.monitorMinedPayments(this.paymentContract, this.mongoInterface, this.poolConfig)}.bind(this),5*1000)

            setInterval(function(){TransactionCoordinator.monitorMinedSolutions(  this.mongoInterface, this.poolConfig)}.bind(this),5*1000)
 


          //  setTimeout(function(){TransactionHelper.broadcastPaymentBatches(this.paymentContract, this.mongoInterface, this.poolConfig)}.bind(this),0)
  } 

  /*
  KEY
  queued - transaction not broadcasted yet
  pending - transaction broadcasted but not mined
  mined - transaction mined !
  successful - transaction mined and not reverted

  */
 

   static  async monitorMinedPayments(paymentContract, mongoInterface, poolConfig)
  {

    
    try{ 

      let payment_txes = await TransactionHelper.findTransactionsWithQuery({ txType:'batched_payment', status:'pending' } ,mongoInterface)

      let web3 = new Web3(poolConfig.paymentsConfig.web3Provider)
   
 
       if( payment_txes != null && payment_txes.length > 0) {
      

        TransactionHelper.checkTransactionReceipts( payment_txes , web3, mongoInterface)
      }
    
    }catch(e){
       console.log('error',e)
      }


     
  } 


  static async monitorMinedSolutions( mongoInterface, poolConfig )
  {

    

   try {
    console.log('monitor mined solutions ')
   
   let solution_txes = await TransactionHelper.findTransactionsWithQuery({ txType:'solution', status:'pending' } ,mongoInterface)

   let web3 = new Web3(poolConfig.mintingConfig.web3Provider)
    
   if( solution_txes != null && solution_txes.length > 0)
    {
      //look for receipt 
       var response = await TransactionHelper.checkTransactionReceipts( solution_txes , web3, mongoInterface)
    }
   }catch(e)
   {
   console.log('error',e)
    }

    
  } 

 

 
 



//types are 'batched_payment','solution'
   static async addTransactionToQueue(txType, txData,  mongoInterface, poolConfig)
  {

   

    

    var blockNum  = await TokenDataHelper.getEthBlockNumber( mongoInterface );

    var packetData = {
       block: blockNum,
       txType: txType, //batched_payment or solution 
       txData: txData, 
       txHash: null,
       status: 'queued'  //queued, pending, reverted, success 

     }

     console.log( '\n\n' )

     console.log( ' addTransactionToQueue ',  packetData )


     await mongoInterface.insertOne('transactions', packetData)

 

  } 


/*
  async markTransactionAsLost(tx_hash,packetData)
  {

    console.log('mark transaction as lost !!!! ')

    await this.redisInterface.pushToRedisList("lost_transactions_list", JSON.stringify(packetData))

    var packetDataJSON = await this.redisInterface.findHashInRedis('active_transactions',tx_hash);
    var packetData = JSON.parse(packetDataJSON)


    packetData.receiptData = {  //lost
          queued:false,
          pending:false,
          mined:false,
          success:false,
          lost: true
        }


          //resave
      var storage_success = await TransactionHelper.storeEthereumTransaction(tx_hash,packetData);


  } */



/*

  async getPacketReceiptDataFromWeb3Receipt(liveTransactionReceipt)
  {

    var mined = (liveTransactionReceipt != null  )
    var success = false

    if( mined )
    {
        success =  ((liveTransactionReceipt.status == true)
                                       || (web3utils.hexToNumber( liveTransactionReceipt.status) == 1 ))
   }

    var receiptData = {
      queued:false,
      pending:!mined,
      mined:mined,
      success:success
    }


    return receiptData;


  } */




  async broadcastQueuedMintTransactions(mongoInterface, poolConfig){
    console.log('broadcastQueuedMintTransactions')
   

   
    let pendingMintTransactions = await TransactionHelper.findTransactionsWithQuery({txType:'solution',status:'pending'},mongoInterface)

    var hasPendingTransaction = (pendingMintTransactions.length > 0);

  

    var nextQueuedTransactionData = await TransactionHelper.findOneTransactionWithQuery({txType:'solution',status:'queued'},mongoInterface) //JSON.parse(nextQueuedTransactionDataJSON)
 
 
   
    var hasQueuedTransaction = (nextQueuedTransactionData != null)

       
       if( hasQueuedTransaction && !hasPendingTransaction ){

          try{


             //var nextQueuedTransactionData = await this.redisInterface.popFromRedisList('queued_mint_transactions'  )
             console.log('nextQueuedTransactionData',nextQueuedTransactionData)
               
            

             var successful_broadcast = await this.broadcastTransaction(nextQueuedTransactionData, mongoInterface, poolConfig);

             if(!successful_broadcast)
             {
               console.error('unsuccessful broadcast ! ')

               //this is putting in a bad entry !! like 'true '
               //   await this.redisInterface.pushToRedisList('queued_transactions',nextQueuedTransactionData)
             }

          }
          catch(e)
          {
          console.log('error',e);
          }
       }
     //  setTimeout(function(){this.broadcastQueuedMintTransactions(mongoInterface)}.bind(this),5 * 1000)

   } 

 
   async broadcastQueuedBatchedPaymentTransactions(mongoInterface, poolConfig){
    console.log('broadcastQueuedBatchedPaymentTransactions')
   

   
    let pendingTransactions = await TransactionHelper.findTransactionsWithQuery({txType:'batched_payment',status:'pending'},mongoInterface)

    var hasPendingTransaction = (pendingTransactions.length > 0);

  

    var nextQueuedTransactionData = await TransactionHelper.findOneTransactionWithQuery({txType:'batched_payment',status:'queued'},mongoInterface) //JSON.parse(nextQueuedTransactionDataJSON)
 
 
   
    var hasQueuedTransaction = (nextQueuedTransactionData != null)

       
       if( hasQueuedTransaction && !hasPendingTransaction ){

          try{ 

              console.log('nextQueuedTransactionData',nextQueuedTransactionData)
                

             var successful_broadcast = await this.broadcastTransaction(nextQueuedTransactionData, mongoInterface, poolConfig);

             if(!successful_broadcast)
             {
               console.error('unsuccessful broadcast ! ')  
             }

          }
          catch(e)
          {
          console.log('error',e);
          }
       }
     //  setTimeout(function(){this.broadcastQueuedMintTransactions(mongoInterface)}.bind(this),5 * 1000)

   } 


   async requeueSkippedBatchedPaymentTransactions(mongoInterface, poolConfig){
    console.log('reQueuedSkippedBatchedPaymentTransactions')
    
    let pendingTransactions = await TransactionHelper.findTransactionsWithQuery({txType:'batched_payment',status:'skipped'},mongoInterface)

    let currentEthBlock = await TokenDataHelper.getEthBlockNumber(mongoInterface)

    if(!currentEthBlock)return;

    for(let pendingTransaction of pendingTransactions){

      if(!pendingTransaction.block || pendingTransaction.block < currentEthBlock-500){
        await mongoInterface.updateOne('transactions',{_id:pendingTransaction._id}, 
            {block: currentEthBlock, status:'queued'} )
      }

    }



   }



/*   THIS IS THE OLD VERSION 

   static async broadcastPaymentBatches(paymentContract, mongoInterface, poolConfig)
   {
  
 
      //if we have a pending broadcasting batch just continue..
      //IMPLEMENT ^
 
      var broadcastedPayment = null;
 
       try {
 
 
         var currentEthBlock = await TokenDataHelper.getEthBlockNumber( mongoInterface);
 
         var REBROADCAST_WAIT_BLOCKS = Math.min(10, poolConfig.rebroadcastPaymentWaitBlocks);
 
 
         var unconfirmedBatches = await mongoInterface.findAll('payment_batch',{confirmed: false}   )
 
 
 
        for(var element of unconfirmedBatches)
        {
 
          console.log('checking batch for transfer - ', element.id, element.broadcastedAt , currentEthBlock )
          ///if it has not been recently broadcasted
          if(element.broadcastedAt == null || element.broadcastedAt < (currentEthBlock - REBROADCAST_WAIT_BLOCKS)){
 
              var complete = await paymentContract.methods.paymentSuccessful(element.id).call()  ;
 
              //if it REALLY has never been completed before  (double check)
              if(!complete )
              {
                broadcastedPayment = await this.transferPaymentBatch(element)
                break; //we will broadcast just this one and that is all
              }
 
          }
        }
         //  var unbatched_pmnts = await this.mongoInterface.findAll('balance_payment',{batchId: null})
         // await this.batchMinedPayments( unbatched_pmnts )
 
 
 
 
       }catch(e){
        console.log('error',e)
       }
 
 
      setTimeout(function(){this.broadcastPaymentBatches(paymentContract, mongoInterface, poolConfig)}.bind(this),10*60*1000)  //ten minutes
 
   //   return broadcastedPayment;
   } 
*/
   




 

    //?? not used ? 
   async updateLastBroadcastDataForTx(txHash,broadcastData)
   {
      var broadcastAtBlock ;
      var accountTxNonce ;



   } 


   async broadcastTransaction(transactionPacketData, mongoInterface, poolConfig)
   {
    //var receiptData = transactionPacketData.receiptData;
    var txData = transactionPacketData.txData;
    var txType = transactionPacketData.txType;

    console.log('\n')
     console.log('\n')
    console.log('---- broadcast transaction ---',txType,txData)

    var tx_hash = null;

   if(txType=="solution"){

 
          if(txData == null /*|| currentChallengeNumber !=  txData.challenge_number */)
          {
            console.log('missing txdata !  Not submitting solution to contract ' )
            return false;
          }
  
          var submitResult =    await TransactionHelper.submitMiningSolution(txData.minerEthAddress,txData.solution_number,txData.challenge_digest,txData.challenge_number, mongoInterface, poolConfig)
          
          console.log('submitresult ', submitResult )
 

          if(submitResult.success == true){
             
            tx_hash = submitResult.txResult.txHash 
             
          }

     }else if(txType=="batched_payment"){

      if(txData == null  )
          {
            console.log('missing txdata !  Not submitting solution to contract ' )
            return false;
          }
  
          var submitResult =   await TransactionHelper.submitBatchedPayment(txData, mongoInterface, poolConfig)
          
          console.log('submitresult ', submitResult )
 

          if(submitResult.success == true){
             
            tx_hash = submitResult.txResult.txHash 
             
          }

    }else{
      console.error('invalid tx type!',txType)
      return false;
    }




    if(tx_hash == null){
      console.error('Tx not broadcast successfully',txType,txData )

      ///Store new transfer data with a null tx_hash  which we will pick up later and then grab a receipt for !!!
      
      await TransactionHelper.updateOneTransactionById(transactionPacketData._id, {status:'skipped'}, mongoInterface)

      return false;
    }else{
      console.log('broadcasted transaction -> ',tx_hash,txType,txData)

      //if( txType=="solution"){
       // await this.storeNewSubmittedSolutionTransactionHash(tx_hash, txData.tokenReward, txData.minerEthAddress, txData.challenge_number )
     // }

        await TransactionHelper.updateOneTransactionById(transactionPacketData._id, {status:'pending', txHash: tx_hash}, mongoInterface)

 
 

        return true

    }

  } 


 

    async getTransactionStatistics(mongoInterface){
      return await mongoInterface.findOne('transactionsMetrics',{})
    }
   //Refactor and test 

   //fix me up ! 
      async updateTransactionStatistics(mongoInterface)
      {
        var pendingCount = 0;
        var queuedCount = 0;
        var revertedCount = 0;
        var successCount = 0;

        var queuedMintsCount = 0;


        var pendingMintsCount = 0;
        var pendingPaymentsCount = 0;

        //var queuedMintsTransactions = await mongoInterface.findAll('mint_transactions', {status:'queued'}) //await this.redisInterface.getElementsOfListInRedis('queued_mint_transactions')


        ///mint AND transfer type transactions are in here 
        var ethereumTransactions  = await mongoInterface.findAll('transactions') // await this.redisInterface.getResultsOfKeyInRedis('active_transactions')

       

       ethereumTransactions.map(function(item){

        //  console.log('item',item)


          var transactionStatus = item.status;


          if(transactionStatus == 'pending'){
            pendingCount++;

            if(item.txType == 'transfer')
            {
                pendingPaymentsCount++;
            }
            if(item.txType == 'solution')
            {
                pendingMintsCount++;
            }
          }


          if(transactionStatus == 'queued' ){
            queuedCount++;


            if(item.txType == 'solution')
            {
                queuedMintsCount++;
            }
          }

          if(transactionStatus == 'reverted')revertedCount++;
          if(transactionStatus == 'success')successCount++;

        })

          let newTxMetrics = {
            queuedTxCount: queuedCount,
            pendingTxCount: pendingCount,
            successTxCount:successCount,
            revertedTxCount: revertedCount,

            queuedMintsCount: queuedMintsCount,
            queuedPaymentsCount: 0,
            pendingMintsCount: pendingMintsCount,
            pendingPaymentsCount: pendingPaymentsCount
          }


          await mongoInterface.upsertOne('transactionsMetrics', {}, newTxMetrics)
 

      /* var stats =  {
         queuedCount: queuedCount,
         pendingCount: pendingCount,
         minedCount: minedCount,
         successCount: successCount,
         pendingMintsCount: pendingMintsCount,
         pendingPaymentsCount: pendingPaymentsCount
       }*/

       return newTxMetrics;




      } 





     async requestTransactionData(tx_hash)
     {
       try{
          var data = await this.web3.eth.getTransaction(tx_hash);
        }catch(err)
        {
          console.error("could not find tx ", tx_hash )
          return null;
        }

          return data;
     } 



   async requestTransactionReceipt(tx_hash)
   {

      try{
      var receipt = await this.web3.eth.getTransactionReceipt(tx_hash);
      }catch(err)
      {
        console.error("could not find receipt ", tx_hash )
        return null;
      }
        return receipt;


   } 


   //required for balance payouts
      async storeNewSubmittedSolutionTransactionHash(tx_hash, tokensAwarded, minerEthAddress, challengeNumber)
      {
        var blockNum = await TokenDataHelper.getEthBlockNumber(this.mongoInterface);

        var txData = {
          block: blockNum,
          tx_hash: tx_hash,
          minerEthAddress: minerEthAddress,
          challengeNumber: challengeNumber,
          mined: false,  //completed being mined ?
          succeeded: false,
          token_quantity_rewarded: tokensAwarded,
          rewarded: false   //did we win the reward of 50 tokens ?
        }

          console.log('Storing submitted solution data ', txData)
         this.redisInterface.storeRedisHashData('unconfirmed_submitted_solution_tx',tx_hash,JSON.stringify(txData) )
      } 


      /*
        This method is deprecated as it cannot handle TX that fail to broadcast

      */
      async storeNewSubmittedTransferData(txHash, addressTo, balancePaymentId, tokenAmount)
      {

            var blockNumber =  await TokenDataHelper.getEthBlockNumber(this.mongoInterface);


            var balanceTransferData = {
              addressTo: addressTo,
              balancePaymentId: balancePaymentId,
              tokenAmount: tokenAmount,
              txHash: txHash,
              block:blockNumber,
              confirmed: false
            }

              console.log('Storing new submitted transfer data',('balance_transfers:'+addressTo.toString()),balanceTransferData)

            //helps audit payouts
            //this guy never gets updated and so should not be used
          await this.redisInterface.pushToRedisList(('balance_transfers:'+addressTo.toString()), JSON.stringify(balanceTransferData)  )


          await this.redisInterface.storeRedisHashData('balance_transfer',balancePaymentId, JSON.stringify(balanceTransferData)  )

        } 





     async getBalanceTransferConfirmed(paymentId)
     {
        //check balance payment

        var balanceTransferJSON = await this.redisInterface.findHashInRedis('balance_transfer',paymentId);
        var balanceTransfer = JSON.parse(balanceTransferJSON)


        if(balanceTransferJSON == null || balanceTransfer.txHash == null)
        {
          return false;
        }else{

          //dont need to check receipt because we wait many blocks between broadcasts - enough time for the monitor to populate this data correctly
          return balanceTransfer.confirmed;

        }


     } 














}
