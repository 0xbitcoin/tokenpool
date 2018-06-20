

/*

Turns queued ethereum transaction into actual ones :)

Waits for pending TX to be mined before sending another !

Solutions are highest priority

*/


const Tx = require('ethereumjs-tx')



var paymentContractJSON = require('../app/assets/contracts/BatchedPayments.json');
var deployedContractInfo = require('../app/assets/contracts/DeployedContractInfo.json');


var web3utils = require('web3-utils')

 var lastRebroadcastBlock = 0;


const PAYMENT_BROADCAST_PERIOD = 100 * 1000;

module.exports =  {

  async init(web3,tokenContract,poolConfig,accountConfig,redisInterface,mongoInterface,tokenInterface,pool_env)
  {
    this.web3=web3;
    this.redisInterface=redisInterface;
    this.mongoInterface=mongoInterface;
    this.tokenContract = tokenContract;
    this.tokenInterface = tokenInterface;
    this.accountConfig= accountConfig;
    this.poolConfig= poolConfig;
    this.pool_env=pool_env;


    this.paymentContract =  new web3.eth.Contract(paymentContractJSON.abi,this.getPaymentContractAddress())



  },

  async update()
  {


          var self=this;

            //setTimeout(function(){self.broadcastQueuedPaymentTransactions()},0)
            setTimeout(function(){self.broadcastQueuedMintTransactions()},0)

            setTimeout(function(){self.updateBroadcastedTransactionStatus()},0)

            setTimeout(function(){self.monitorMinedPayments()},0)

            setTimeout(function(){self.broadcastPaymentBatches()},0)
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
        await this.checkBatchPaymentsStatus()
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


       var batchedPayments = 0;


       const MIN_PAYMENTS_IN_BATCH = 5; //5

      if( unbatched_pmnts.length >= MIN_PAYMENTS_IN_BATCH)
      {


        var batchData = {
          id: web3utils.randomHex(32),
          confirmed: false
        }

        await self.mongoInterface.upsertOne('payment_batch',{id: batchData.id},   batchData  )



        var paymentsToBatch = unbatched_pmnts.slice(0,25)  //max to batch is 25

        for( var element of paymentsToBatch )   {

           element.batchId = batchData.id;

            await self.mongoInterface.upsertOne('balance_payment',{id: element.id},  element  )

            batchedPayments++;

        }


      }

       return {success:true,batchedPayments:batchedPayments} ;
     },




     /*
      Ask the smart contract if that id is in the mapping
     */
     async checkBatchPaymentsStatus()
     {
       console.log('checkBatchPaymentsStatus')

       var self = this;

       var unconfirmedBatches =   await self.mongoInterface.findAll('payment_batch',{confirmed: false}   )

       //this type of for loop works with async & .forEach does not
       for( var element of unconfirmedBatches )   {

         console.log(self.getPaymentContractAddress(), element.id)

          var complete = await self.paymentContract.methods.paymentSuccessful(element.id).call()  ;
          console.log('complete??',complete)

          if(complete)
          {
            element.confirmed = true;

            await self.markPaymentsCompleteForBatch( element )
          }

          await self.mongoInterface.upsertOne('payment_batch',{id: element.id},  element  )

       }

       console.log('done w for each ')


        return true ;
     },

     async markPaymentsCompleteForBatch(batchPayment)
     {

       var self = this;
       //await self.mongoInterface.upsertOne('balance_payment',{id: element.id},  element  )
      // var paymentsForBatch =   await self.mongoInterface.findAll('balance_payment',{batchId: false}   )
       var paymentsForBatch = await self.mongoInterface.findAll('balance_payment',{batchId: batchPayment.id})


       for( var element of unconfirmedBatches )   {

          element.txHash = batchPayment.txHash;
          element.complete = batchPayment.complete;
          element.broadcastedAt = batchPayment.broadcastedAt;

         await self.mongoInterface.upsertOne('balance_payment',{id: element.id},  element  )

       }

       return true;
     },


     //wait 5000 blocks in between batch broadcasts
     async broadcastPaymentBatches()
     {

       var self = this ;


        //if we have a pending broadcasting batch just continue..
        //IMPLEMENT ^
        var broadcastedPayment = null;

         try {


           var currentEthBlock = await self.redisInterface.getEthBlockNumber();

           var REBROADCAST_WAIT_BLOCKS = 2550;


           var unconfirmedBatches = await self.mongoInterface.findAll('payment_batch',{confirmed: false}   )



          for(var element of unconfirmedBatches)
          {

            ///if it has not been recently broadcasted
            if(element.broadcastedAt == null || element.broadcastedAt < (currentEthBlock - REBROADCAST_WAIT_BLOCKS)){

                var complete = await self.paymentContract.methods.paymentSuccessful(element.id).call()  ;

                //if it REALLY has never been completed before  (double check)
                if(!complete )
                {
                  broadcastedPayment = await self.transferPaymentBatch(element)
                  break; //we will broadcast just this one and that is all
                }

            }
          }
           //  var unbatched_pmnts = await this.mongoInterface.findAll('balance_payment',{batchId: null})
           // await this.batchMinedPayments( unbatched_pmnts )




         }catch(e){
          console.log('error',e)
         }


        setTimeout(function(){self.broadcastPaymentBatches()},30*60*1000)  //thirty minutes

        return broadcastedPayment;
     },







/*
       async oldMonitorMinedPayments(balance_xfers)
       {

          console.log('check mined payments ',balance_xfers.length)

       var currentEthBlock = await this.redisInterface.getEthBlockNumber();

       var REBROADCAST_WAIT_BLOCKS = 2550;


       if( balance_xfers == null  )
       {
         balance_xfers = [];
       }



       console.log("\n\n")
       console.log(" ------ " + balance_xfers.length)
       for(i in balance_xfers)
       {


         var paymentId = balance_xfers[i];

         console.log('paymentId',paymentId)


        var paymentDataJSON = await this.redisInterface.findHashInRedis('balance_payment',paymentId);
        var paymentData = JSON.parse(paymentDataJSON)

        //who to pay and how much to pay them
        var tokenAmount = paymentData.previousTokenBalance;
        var minerAddress = paymentData.minerAddress;


        var txDataJSON = await this.redisInterface.findHashInRedis('payment_tx',paymentId);
        var txData = JSON.parse(txDataJSON)


        var balanceTransferJSON = await this.redisInterface.findHashInRedis('balance_transfer',paymentId);
        var transferData = JSON.parse(balanceTransferJSON)


         console.log('balanceTransferJSON',balanceTransferJSON)

        //  Too confusing !! too many data pieces are being examined


        //if a tx exists and was confirmed, we don't need to touch it
        //is this correct !?
        if(transferData != null && transferData.confirmed == true && transferData.succeeded == true )
        {
          continue;
        }
        if(transferData != null && transferData.tx_hash == null)
        {
          console.log('skipping rebroadcasting transfer with null txhash ...')
          continue;
        }


        //if a tx doesn't exist or it does but is unconfirmed and old, we need to pay it
        if(txDataJSON == null || (txData.last_broadcast_block < (currentEthBlock - REBROADCAST_WAIT_BLOCKS)) )
        {
          if(txData!=null)
          {
            console.log('check unconfirmed mined payment', txData.last_broadcast_block ,  (currentEthBlock - REBROADCAST_WAIT_BLOCKS))

          }


          //make a payment_tx and set its block to a current one

          var broadcastedPaymentData = {
               balancePaymentId: paymentId,
               minerAddress: minerAddress.toString().toLowerCase(),
               tokenAmount: tokenAmount,
               last_broadcast_block: currentEthBlock
            }

          await this.redisInterface.storeRedisHashData('payment_tx' ,paymentId ,JSON.stringify(broadcastedPaymentData) )

          console.log('check unconfirmed mined payment more', balanceTransferJSON ) ;


          //if there is no complete transfer data...
          if(balanceTransferJSON == null || transferData.txHash == null || transferData.confirmed != true )
          {

            var transferData = {
              addressTo:  minerAddress,
              balancePaymentId: paymentId,
              tokenAmount: tokenAmount,
              txHash: null,
              block:currentEthBlock,
              confirmed: false
            }

            //I think this has a null amount


            //need to rebroadcast for sure
            await this.queueBalancePayment(transferData)

          }

        }




              console.log('inspecting unconfirmed balance transfer??',transferData)

         if ( minerAddress !=null && transferData != null && transferData.txHash != null && transferData.confirmed != true)
          {
            //try to get receipt via txhash


            //var confirmed = await this.getBalanceTransferConfirmed()

            var txHash = transferData.txHash;


            console.log('inspecting unconfirmed balance transfer!',txHash)

            var liveTransactionReceipt = await this.requestTransactionReceipt(txHash)

            if(liveTransactionReceipt != null )
            {
              console.log('got receipt',liveTransactionReceipt )

              transferData.confirmed = true;//also called 'mined'

              //better version
              var transaction_succeeded = ((liveTransactionReceipt.status == true)
                                             || (web3utils.hexToNumber( liveTransactionReceipt.status) == 1 ))


              if( transaction_succeeded )
              {
                transferData.succeeded = true;
                console.log('transaction was mined and succeeded',txHash)
              }else {
                transferData.succeeded = false;
                //await this.queueBalancePayment(transferData)
                console.log('transaction was mined and failed',txHash)
              }

              //await this.redisInterface.deleteHashInRedis('unconfirmed_broadcasted_payment',paymentId)

              //save balance_transfer as confirmed
              await this.redisInterface.storeRedisHashData('balance_transfer' ,paymentId,JSON.stringify(transferData) )

              //this one is for profile rendering
              await this.redisInterface.storeRedisHashData('balance_transfer:'+minerAddress.toString().toLowerCase() ,paymentId,JSON.stringify(transferData) )

            }else{
              console.log('got null balance transfer receipt',txHash)
            }

            //maybe rebroadcast if it failed


            //hdel this record so we dont keep checking it
            //save a new happy confirmed record

          }




       }

     },


*/








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

             var successful_broadcast = await this.broadcastTransaction(nextQueuedTransaction, false);

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

              var successful_broadcast = await this.broadcastTransaction(nextQueuedTransaction, false);

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


   async broadcastTransaction(transactionPacketData,resending)
   {
    var receiptData = transactionPacketData.receiptData;
    var txData = transactionPacketData.txData;
    var txType = transactionPacketData.txType;

    console.log('\n')
     console.log('\n')
    console.log('---- broadcast transaction ---',txType,txData)

    var tx_hash = null;

    if(txType == 'transfer'){


          if(txData.addressFromType == 'minting')
          {
            var addressFrom = this.getMintingAccount().address;
          }else{
            var addressFrom = this.getPaymentAccount().address;
          }


          if(txData == null || txData.addressTo == addressFrom )
          {
            console.log('cant send transfer to self!!' )
            return false;
          }

          var tx_hash = await this.transferTokensFromPool(txData.addressFromType, txData.addressTo, txData.tokenAmount, txData.balancePaymentId , resending)


    }else if(txType=="solution"){
          var currentChallengeNumber = await this.requestCurrentChallengeNumber();

          if(txData == null || currentChallengeNumber !=  txData.challenge_number )
          {
            console.log('stale challenge number!  Not submitting solution to contract ' )
            return false;
          }



            var tx_hash = await this.submitMiningSolution(txData.minerEthAddress,txData.solution_number,txData.challenge_digest,txData.challenge_number, resending)


    }else{
      console.error('invalid tx type!',txType)
      return false;
    }

    if(tx_hash == null){
      console.error('Tx not broadcast successfully',txType,txData )

      ///Store new transfer data with a null tx_hash  which we will pick up later and then grab a receipt for !!!
      if(txType =="transfer"){
        //how will we pick up the txhash later... ?
        await this.storeNewSubmittedTransferData(null, txData.addressTo, txData.balancePaymentId, txData.tokenAmount )
      }

      return false;
    }else{
      console.log('broadcasted transaction -> ',tx_hash,txType,txData)

      if( txType=="solution"){
        await this.storeNewSubmittedSolutionTransactionHash(tx_hash, txData.tokenReward, txData.minerEthAddress, txData.challenge_number )
      }

      if(txType =="transfer"){
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


        async transferPaymentBatch(batchPayment)
        {
          console.log('broadcasting ', batchPayment)

          var self = this;

          var currentEthBlock = await self.redisInterface.getEthBlockNumber();

          batchPayment.broadcastedAt = currentEthBlock;

          await self.mongoInterface.upsertOne('payment_batch',{id: batchPayment.id},  batchPayment  )



         //do the broadcast here


         var addressTo = this.paymentContract.options.address;

         //by default, transfer from payout address
         var privateKey = this.getPaymentAccount().privateKey;
         var addressFrom = this.getPaymentAccount().address;

         var tokenAddress = this.tokenContract.options.address;
         var toAddressArray = [];
         var toValueArray = [];

         var paymentsInBatch =  await self.mongoInterface.findAll('balance_payment',{batchId: batchPayment.id})
         for(var payment of paymentsInBatch)
         {
           toAddressArray.push(payment.minerAddress)
           toValueArray.push(payment.previousTokenBalance) //get in satoastis ?
         }



         try{
           var txCount = await this.web3.eth.getTransactionCount(addressFrom);
           console.log('txCount',txCount)
          } catch(error) {  //here goes if someAsyncPromise() rejected}
           console.log(error);

            return error;    //this will result in a resolved promise.
          }




          console.log([tokenAddress, batchPayment.id, toAddressArray, toValueArray])

         var txData = this.web3.eth.abi.encodeFunctionCall({
                 name: 'multisend',
                 type: 'function',
                 inputs: [
                   {
                     "name": "_tokenAddr",
                     "type": "address"
                   },
                   {
                     "name": "paymentId",
                     "type": "bytes32"
                   },
                   {
                     "name": "dests",
                     "type": "address[]"
                   },
                   {
                     "name": "values",
                     "type": "uint256[]"
                   }
                 ]
             }, [tokenAddress, batchPayment.id, toAddressArray, toValueArray]);

             var max_gas_cost = 1704624;

             var transferMethod = this.paymentContract.methods.multisend(tokenAddress,batchPayment.id, toAddressArray, toValueArray);

              console.log('from',addressFrom)




               var estimatedGasCost = await transferMethod.estimateGas({  gas: max_gas_cost, from:addressFrom, to: addressTo });


               if( estimatedGasCost > max_gas_cost){
                 console.log("Gas estimate too high!  Something went wrong ")
                 return;
               }else {
                 console.log('estimated gas ', estimatedGasCost)
               }




             const txOptions = {
               nonce: web3utils.toHex(txCount),
               gas: web3utils.toHex( estimatedGasCost ),
               gasPrice: web3utils.toHex(web3utils.toWei(this.poolConfig.transferGasPriceWei.toString(), 'gwei') ),
               value: 0,
               to: addressTo,
               from: addressFrom,
               data: txData
             }

             var txHash = await new Promise(function (result,error) {

                  this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
                   if (err) error(err)
                     result(res)
                 })

               }.bind(this));



            if(txHash)  //not guaranteed, only for rendering-- NOT for logic
            {
              batchPayment.txHash = txHash;
              await self.mongoInterface.upsertOne('payment_batch',{id: batchPayment.id},  batchPayment  )

            }

          return {success:true,paymentsInBatch:paymentsInBatch,txHash:txHash};
        },


      //DEPRECATED
     async transferTokensFromPool(addressFromType, ethMinerAddress, amount, balancePaymentId, resending)
     {

          var addressTo = this.tokenContract.options.address;

          //by default, transfer from payout address
          var privateKey = this.getPaymentAccount().privateKey;
          var addressFrom = this.getPaymentAccount().address;

          var transferMethod = this.tokenContract.methods.transfer(addressTo,amount);



            //save data
          var ethBlock = await this.getEthBlockNumber();




          if(addressFromType == 'minting')
          {
            var privateKey = this.getMintingAccount().privateKey;
            var addressFrom = this.getMintingAccount().address;
          }else{
            var paymentConfirmed = await this.getBalanceTransferConfirmed(balancePaymentId);
            if(paymentConfirmed) return;
          }




          try{
            var txCount = await this.web3.eth.getTransactionCount(addressFrom);
            console.log('txCount',txCount)
           } catch(error) {  //here goes if someAsyncPromise() rejected}
            console.log(error);

             return error;    //this will result in a resolved promise.
           }


           var txData = this.web3.eth.abi.encodeFunctionCall({
                   name: 'transfer',
                   type: 'function',
                   inputs: [{
                       type: 'address',
                       name: 'to'
                   },{
                       type: 'uint256',
                       name: 'tokens'
                   }]
               }, [ethMinerAddress, amount]);


               var max_gas_cost = 1704624;

               var estimatedGasCost = await transferMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });



                   if( estimatedGasCost > max_gas_cost){
                     console.log("Gas estimate too high!  Something went wrong ")
                     return;
                   }


                   var force_revert = false;

                   if(force_revert)
                   {
                     txCount = 9999;
                   }

                   const txOptions = {
                     nonce: web3utils.toHex(txCount),
                     gas: web3utils.toHex(1704624),
                     gasPrice: web3utils.toHex(web3utils.toWei(this.poolConfig.transferGasPriceWei.toString(), 'gwei') ),
                     value: 0,
                     to: addressTo,
                     from: addressFrom,
                     data: txData
                   }

                //   var privateKey =  this.getPaymentAccount().privateKey;





                 return new Promise(function (result,error) {

                      this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
                       if (err) error(err)
                         result(res)
                     })

                   }.bind(this));


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

    async submitMiningSolution(minerAddress,solution_number,challenge_digest,challenge_number,resending){

      var addressFrom = this.getMintingAccount().address;

      console.log( '\n' )
      console.log( '---Submitting solution for reward---')
      console.log( 'nonce ',solution_number )
      console.log( 'challenge_number ',challenge_number )
      console.log( 'challenge_digest ',challenge_digest )
      console.log( '\n' )




     var mintMethod = this.tokenContract.methods.mint(solution_number,challenge_digest);

    try{
      var txCount = await this.web3.eth.getTransactionCount(addressFrom);
      console.log('txCount',txCount)
     } catch(error) {  //here goes if someAsyncPromise() rejected}
      console.log('error',error);

       return error;    //this will result in a resolved promise.
     }


     var addressTo = this.tokenContract.options.address;


      var txData = this.web3.eth.abi.encodeFunctionCall({
              name: 'mint',
              type: 'function',
              inputs: [{
                  type: 'uint256',
                  name: 'nonce'
              },{
                  type: 'bytes32',
                  name: 'challenge_digest'
              }]
          }, [solution_number, challenge_digest]);



      var max_gas_cost = 1704624;

      var estimatedGasCost = await mintMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });


      console.log('estimatedGasCost',estimatedGasCost);
      console.log('txData',txData);

      console.log('addressFrom',addressFrom);
      console.log('addressTo',addressTo);



      if( estimatedGasCost > max_gas_cost){
        console.log("Gas estimate too high!  Something went wrong ")
        return;
      }


      const txOptions = {
        nonce: web3utils.toHex(txCount),
        gas: web3utils.toHex(estimatedGasCost),
        gasPrice: web3utils.toHex(web3utils.toWei(this.poolConfig.solutionGasPriceWei.toString(), 'gwei') ),
        value: 0,
        to: addressTo,
        from: addressFrom,
        data: txData
      }

      var privateKey =  this.getMintingAccount().privateKey;

    return new Promise(function (result,error) {

         this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
          if (err) error(err)
            result(res)
        })

      }.bind(this));


    },




    async sendSignedRawTransaction(web3,txOptions,addressFrom,private_key,callback) {

      var privKey = this.truncate0xFromString( private_key )

      const privateKey = new Buffer( privKey, 'hex')
      const transaction = new Tx(txOptions)


      transaction.sign(privateKey)


      const serializedTx = transaction.serialize().toString('hex')

        try
        {
          var result =  web3.eth.sendSignedTransaction('0x' + serializedTx, callback)
        }catch(e)
        {
          console.log('error',e);
        }
    },



       async requestCurrentChallengeNumber()
       {


         var self = this ;
         var result =  new Promise(function (fulfilled,error) {

           self.tokenContract.methods.getChallengeNumber().call(function(err, result){
              if(err){error(err);return;}

              fulfilled(result)

            });
          });



         return result;
       },



     truncate0xFromString(s)
    {
      if(s.startsWith('0x')){
        return s.substring(2);
      }
      return s;
    },

     getMintingAccount()
     {
       return this.accountConfig.minting;
     },

     getPaymentAccount()
     {
       return this.accountConfig.payment;
     },

     getPaymentContractAddress()
     {
       if(this.pool_env == 'test')
       {
         return deployedContractInfo.networks.testnet.contracts.batchedpayments.blockchain_address;
       }else if(this.pool_env == 'staging'){
         return deployedContractInfo.networks.staging.contracts.batchedpayments.blockchain_address;
       }else{
         return deployedContractInfo.networks.mainnet.contracts.batchedpayments.blockchain_address;
       }

     }



}
