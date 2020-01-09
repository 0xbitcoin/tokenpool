

/*

Turns queued ethereum transaction into actual ones :)

Waits for pending TX to be mined before sending another !

Solutions are highest priority

*/


const Tx = require('ethereumjs-tx')
const TransactionHelper = require('./util/transaction-helper')
const poolConfig = require('../pool.config').config

var paymentContractJSON = require('../app/assets/contracts/BatchedPayments.json');
var deployedContractInfo = require('../app/assets/contracts/DeployedContractInfo.json');


var web3utils = require('web3-utils')

 var lastRebroadcastBlock = 0;

 //var TransactionHelper = new TransactionHelper();


const PAYMENT_BROADCAST_PERIOD = 100 * 1000;

module.exports =  {

  async init(web3, pool_env,  redisInterface,mongoInterface )
  {


    this.web3=web3;
    this.redisInterface=redisInterface;
    this.mongoInterface=mongoInterface;

  //  this.mintHelperContract = mintHelperContract;


    this.pool_env=pool_env;

    TransactionHelper.init(web3,pool_env,redisInterface,mongoInterface);


  },

  async update()
  {


          var self=this;

            //setTimeout(function(){self.broadcastQueuedPaymentTransactions()},0)
            setTimeout(function(){self.broadcastQueuedMintTransactions()},0)

            setTimeout(function(){self.updateBroadcastedTransactionStatus()},0)

            setTimeout(function(){self.monitorMinedPayments()},0)

            setTimeout(function(){TransactionHelper.broadcastPaymentBatches()},0)
  },

  /*
  KEY
  queued - transaction not broadcasted yet
  pending - transaction broadcasted but not mined
  mined - transaction mined !
  successful - transaction mined and not reverted

  */
  async getEthBlockNumber()
  {
    var result = parseInt( await this.redisInterface.loadRedisData('ethBlockNumber' ));

    if(isNaN(result) || result < 1) result = 0 ;

    return result
  },



  async monitorMinedPayments()
  {

    var self = this ;

      try {


           await this.batchMinedPayments(   )

      }catch(e){
       console.log('error',e)
      }

      try {
        await TransactionHelper.checkBatchPaymentsStatus()
      }catch(e){
       console.log('error',e)
      }


     setTimeout(function(){self.monitorMinedPayments()},30*1000)  //30 seconds

  },



  /*
    For every balance payment, make sure there is a good transfer payment

  */
     async batchMinedPayments(  )
     {
       var self = this ;



       var unbatched_pmnts = await self.mongoInterface.findAll('balance_payment',{batchId: null})

        console.log('check unbatched mined payments: ', unbatched_pmnts.length)


       var batchedPayments = 0;


       const MIN_PAYMENTS_IN_BATCH = Math.min(1, poolConfig.minPaymentsInBatch); //5

      if( unbatched_pmnts.length >= MIN_PAYMENTS_IN_BATCH)
      {


        var batchData = {
          id: web3utils.randomHex(32),
          confirmed: false
        }

        await self.mongoInterface.upsertOne('payment_batch',{id: batchData.id},   batchData  )



        var paymentsToBatch = unbatched_pmnts.slice(0,25)  //max to batch is 25

        //add these payments to the new batch by setting their foreign key 
        for( var element of paymentsToBatch )   {

           element.batchId = batchData.id;

            await self.mongoInterface.upsertOne('balance_payment',{id: element.id},  element  )

            batchedPayments++;

        }


      }

       return {success:true,batchedPayments:batchedPayments} ;
     },







     //wait 5000 blocks in between batch broadcasts




//types are 'transfer','solution'
  async addTransactionToQueue(txType,txData)
  {

    //add to redis

    var receiptData = {
      queued:true,
      pending:false,
      mined:false,
      success:false,
    }
    var blockNum  = await this.getEthBlockNumber();

    var packetData = {
      block: blockNum,
      txType: txType,
      txData: txData,
       receiptData: receiptData
     }

     console.log( '\n\n' )

     console.log( ' addTransactionToQueue ',  packetData )

    //packt data is undefined !!
    if (packetData.txType == 'solution')
    {
      await this.redisInterface.pushToRedisList('queued_mint_transactions',JSON.stringify(packetData) )
    }

    //if (packetData.txType == 'transfer')
    //{
      //await this.redisInterface.pushToRedisList('queued_payment_transactions',JSON.stringify(packetData) )
  //  }

  },



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
      var storage_success = await this.storeEthereumTransaction(tx_hash,packetData);


  },


  //broadcasted to the network
  async storeEthereumTransaction(tx_hash,packetData)
  {

    console.log('storing data about eth tx ', tx_hash, packetData )


    await this.redisInterface.storeRedisHashData('active_transactions',tx_hash,JSON.stringify(packetData) )


    var listPacketData = packetData;
    listPacketData.txHash = tx_hash;

    await this.redisInterface.pushToRedisList('active_transactions_list', JSON.stringify(listPacketData))

    var ethereumTransactionHashes = await this.redisInterface.getResultsOfKeyInRedis('active_transactions')

    for(i in ethereumTransactionHashes)
    {
      var txHash = ethereumTransactionHashes[i];
      if (txHash == false) exit() //emergency kill switch to debug
    }

    return true
  },


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


  },




  async broadcastQueuedMintTransactions(){

    var self = this;

    var transactionStats = await this.getTransactionStatistics(); // .queuedCount .pendingCount  .minedCount

    var hasPendingTransaction = true;


    var nextQueuedTransactionDataJSON = await this.redisInterface.peekFirstFromRedisList('queued_mint_transactions'  );


    var nextQueuedTransactionData = JSON.parse(nextQueuedTransactionDataJSON)



    if(nextQueuedTransactionData!=null && nextQueuedTransactionData.txType == 'solution')
    {
      hasPendingTransaction = (transactionStats.pendingMintsCount > 0);
    }

    var hasQueuedTransaction = (transactionStats.queuedCount > 0)

       if( hasQueuedTransaction && !hasPendingTransaction ){

          try{


             var nextQueuedTransactionData = await this.redisInterface.popFromRedisList('queued_mint_transactions'  )
             console.log('nextQueuedTransactionData',nextQueuedTransactionData)
             //getNextQueuedTransaction()

             nextQueuedTransaction = JSON.parse(nextQueuedTransactionData)

             var successful_broadcast = await this.broadcastTransaction(nextQueuedTransaction);

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
       setTimeout(function(){self.broadcastQueuedMintTransactions()},5 * 1000)

   },



     /*
     *****This may have a bug in which tons of pending tx all go to queued.... which is bad.
      DEPRECATED

     */
   async broadcastQueuedPaymentTransactions(){

     var self = this;

     var transactionStats = await this.getTransactionStatistics(); // .queuedCount .pendingCount  .minedCount

     var hasPendingTransaction = true;


     var nextQueuedTransactionDataJSON = await this.redisInterface.peekFirstFromRedisList('queued_payment_transactions'  );


     var nextQueuedTransactionData = JSON.parse(nextQueuedTransactionDataJSON)

     if(nextQueuedTransactionData!=null && nextQueuedTransactionData.txType == 'transfer')
     {
       hasPendingTransaction = (transactionStats.pendingPaymentsCount > 0);
     }



     var hasQueuedTransaction = (transactionStats.queuedCount > 0)

        if( hasQueuedTransaction && !hasPendingTransaction ){

           try{


              var nextQueuedTransactionData = await this.redisInterface.popFromRedisList('queued_payment_transactions'  )
              console.log('nextQueuedTransactionData',nextQueuedTransactionData)
              //getNextQueuedTransaction()

              nextQueuedTransaction = JSON.parse(nextQueuedTransactionData)

              var successful_broadcast = await this.broadcastTransaction(nextQueuedTransaction);

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
        setTimeout(function(){self.broadcastQueuedPaymentTransactions()},PAYMENT_BROADCAST_PERIOD)

    },



   async updateLastBroadcastDataForTx(txHash,broadcastData)
   {
      var broadcastAtBlock ;
      var accountTxNonce ;



   },


   async broadcastTransaction(transactionPacketData)
   {
    var receiptData = transactionPacketData.receiptData;
    var txData = transactionPacketData.txData;
    var txType = transactionPacketData.txType;

    console.log('\n')
     console.log('\n')
    console.log('---- broadcast transaction ---',txType,txData)

    var tx_hash = null;

   if(txType=="solution"){
          var currentChallengeNumber = await TransactionHelper.requestCurrentChallengeNumber();

          if(txData == null || currentChallengeNumber !=  txData.challenge_number )
          {
            console.log('stale challenge number!  Not submitting solution to contract ' )
            return false;
          }



          //var tx_hash = await TransactionHelper.submitMiningSolutionWithHelper(txData.minerEthAddress,txData.solution_number,txData.challenge_digest,txData.challenge_number)
          var tx_hash = await TransactionHelper.submitMiningSolutionTwo(txData.minerEthAddress,txData.solution_number,txData.challenge_digest,txData.challenge_number)


    }else{
      console.error('invalid tx type!',txType)
      return false;
    }

    if(tx_hash == null){
      console.error('Tx not broadcast successfully',txType,txData )

      ///Store new transfer data with a null tx_hash  which we will pick up later and then grab a receipt for !!!
      if(txType =="transfer"){
        //DEPRECATED
        await this.storeNewSubmittedTransferData(null, txData.addressTo, txData.balancePaymentId, txData.tokenAmount )
      }

      return false;
    }else{
      console.log('broadcasted transaction -> ',tx_hash,txType,txData)

      if( txType=="solution"){
        await this.storeNewSubmittedSolutionTransactionHash(tx_hash, txData.tokenReward, txData.minerEthAddress, txData.challenge_number )
      }

      if(txType =="transfer"){
          //DEPRECATED
        await this.storeNewSubmittedTransferData(tx_hash, txData.addressTo, txData.balancePaymentId, txData.tokenAmount )
      }

      transactionPacketData.receiptData = {
            queued:false,
            pending:true,
            mined:false,
            success:false,
          }

          /*
          var receiptData = {
            queued:false,
            pending:true,
            mined:false,
            success:false,
          }

          var packetData = {txType: txType, txData: txData, receiptData: receiptData}
          */

            //resave
        var storage_success = await this.storeEthereumTransaction(tx_hash,transactionPacketData);


        return true

    }

  },




   async updateBroadcastedTransactionStatus()
   {


     var self = this;

     try{

     var ethereumTransactionHashes = await this.redisInterface.getResultsOfKeyInRedis('active_transactions')

     for(i in ethereumTransactionHashes)
     {
       var txHash = ethereumTransactionHashes[i];


        var packetDataJSON = await this.redisInterface.findHashInRedis('active_transactions',txHash);

        var packetData = JSON.parse(packetDataJSON)


          // console.log('update broadcated tx ',packetData)
          //  console.log('packetData',packetData)



      if(packetData.receiptData.mined == false && packetData.receiptData.lost != true  ){


                           console.log(' active packet: ', packetData )



              var txResponse = await this.requestTransactionData(txHash)

             var receipt = await this.requestTransactionReceipt(txHash)

             console.log(' receipt: ', receipt )

             if( txResponse != null )
             {
               var isPending = (txResponse.transactionIndex != null)
             }

             if(receipt!=null)
             {
               console.log('got receipt storing packet ')
                packetData.receiptData = await this.getPacketReceiptDataFromWeb3Receipt(receipt)

                await this.storeEthereumTransaction(txHash,packetData);

             }else {
               console.log('block of pending tx : ', packetData.block )

               var current_block =await this.getEthBlockNumber();
               var pending_block= packetData.block ;

                var LOST_TX_BLOCK_COUNT = 50

                console.log( current_block ,  pending_block )
               //rebroadcast
               if( (current_block - pending_block > LOST_TX_BLOCK_COUNT  && pending_block > 0)
                  ||  (current_block - pending_block < -10000)     ) //something is messed up
               {

                   console.log('  lost !! ', packetData)


                  lastRebroadcastBlock = current_block;
                   await this.markTransactionAsLost( txHash , packetData)
                  //this.storeEthereumTransaction(txHash,packetData);

               }

             }
       }

     }

     }catch(e)
     {
        //console.log('error',e)
     }

      setTimeout(function(){self.updateBroadcastedTransactionStatus()},2000)
   },




      async getTransactionStatistics()
      {
        var pendingCount = 0;
        var queuedCount = 0;
        var minedCount = 0;
        var successCount = 0;

        var queuedMintsCount = 0;


        var pendingMintsCount = 0;
        var pendingPaymentsCount = 0;

        var queuedMintsTransactions = await this.redisInterface.getElementsOfListInRedis('queued_mint_transactions')


        var ethereumTransactionHashes = await this.redisInterface.getResultsOfKeyInRedis('active_transactions')

        var ethereumTransactions = [];

        for(i in ethereumTransactionHashes){
          var hash = ethereumTransactionHashes[i];
        //  console.log( 'hash',hash)
          ethereumTransactions.push( await this.redisInterface.findHashInRedis('active_transactions',hash) )
        }



        var transactionPacketsData = []

        queuedMintsTransactions.map(item => transactionPacketsData.push(JSON.parse(item)))
        //queuedPaymentsTransactions.map(item => transactionPacketsData.push(JSON.parse(item)))
        ethereumTransactions.map(item => transactionPacketsData.push(JSON.parse(item)))

//        console.log('transactionPacketsData',transactionPacketsData)

        transactionPacketsData.map(function(item){

        //  console.log('item',item)


          var receiptData = item.receiptData;


          if(receiptData.pending){
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


          if(receiptData.queued){
            queuedCount++;


            if(item.txType == 'solution')
            {
                queuedMintsCount++;
            }
          }

          if(receiptData.mined)minedCount++;
          if(receiptData.success)successCount++;

        })


          await this.redisInterface.storeRedisData('queuedTxCount',queuedCount);
          await this.redisInterface.storeRedisData('pendingTxCount',pendingCount);
          await this.redisInterface.storeRedisData('minedTxCount',minedCount);
          await this.redisInterface.storeRedisData('successTxCount',successCount);

          await this.redisInterface.storeRedisData('queuedMintsCount',queuedMintsCount);
          await this.redisInterface.storeRedisData('queuedPaymentsCount',0);
          await this.redisInterface.storeRedisData('pendingMintsCount',pendingMintsCount);
          await this.redisInterface.storeRedisData('pendingPaymentsCount',pendingPaymentsCount);

       var stats =  {
         queuedCount: queuedCount,
         pendingCount: pendingCount,
         minedCount: minedCount,
         successCount: successCount,
         pendingMintsCount: pendingMintsCount,
         pendingPaymentsCount: pendingPaymentsCount
       }

       return stats;




      },





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
     },



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


   },


   //required for balance payouts
      async storeNewSubmittedSolutionTransactionHash(tx_hash, tokensAwarded, minerEthAddress, challengeNumber)
      {
        var blockNum = await this.getEthBlockNumber();

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
      },


      /*
        This method is deprecated as it cannot handle TX that fail to broadcast

      */
      async storeNewSubmittedTransferData(txHash, addressTo, balancePaymentId, tokenAmount)
      {

            var blockNumber = await this.getEthBlockNumber();


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

        },





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


     },














}
