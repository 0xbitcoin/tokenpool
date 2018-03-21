

/*

Turns queued ethereum transaction into actual ones :)

Waits for pending TX to be mined before sending another !

Solutions are highest priority

*/


const Tx = require('ethereumjs-tx')

var web3Utils = require('web3-utils')

 var lastRebroadcastBlock = 0;


module.exports =  {

  async init(web3,tokenContract,poolConfig,accountConfig,redisInterface,tokenInterface)
  {
    this.web3=
    web3;
    this.redisInterface=redisInterface;
    this.tokenContract = tokenContract;
    this.tokenInterface = tokenInterface;
    this.accountConfig= accountConfig;
    this.poolConfig= poolConfig;


      var self=this;
      //  setInterval(function(){ self.sendMiningSolutions()} , 1000)
      //  setInterval(function(){ self.sendTokenTransfers()} , 1000)

        setTimeout(function(){self.broadcastQueuedTransactions()},0)
        setTimeout(function(){self.updateBroadcastedTransactionStatus()},0)
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
    await this.redisInterface.pushToRedisList('queued_transactions',JSON.stringify(packetData) )

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
        success =  (web3Utils.hexToNumber( liveTransactionReceipt.status) == 1 )
    }

    var receiptData = {
      queued:false,
      pending:!mined,
      mined:mined,
      success:success
    }


    return receiptData;


  },

  /*
  This may have a bug in which tons of pending tx all go to queued.... which is bad.


  */
  async broadcastQueuedTransactions(){
    console.log('broadcast txes')

    var self = this;

    var transactionStats = await this.getTransactionStatistics(); // .queuedCount .pendingCount  .minedCount

    var hasPendingTransactions = (transactionStats.pendingCount > 0)
    var hasQueuedTransactions = (transactionStats.queuedCount > 0)

       if( hasQueuedTransactions && !hasPendingTransactions ){

          try{


             var nextQueuedTransactionData = await  this.redisInterface.popFromRedisList('queued_transactions'  )
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
       setTimeout(function(){self.broadcastQueuedTransactions()},1000)

   },




   async updateLastBroadcastDataForTx(txHash,broadcastData)
   {
      var broadcastAtBlock ;
      var accountTxNonce ;



   },

   async rebroadcastTransactionWithHash(txHash)
   {

      var packetDataJSON = await this.redisInterface.findHashInRedis('active_transactions',txHash);

      var packetData = JSON.parse(packetDataJSON)

      console.log('\n')
       console.log('\n')
        console.log('--- REBROADCAST TX ----')
         console.log(packetData)
        console.log('\n')


      await this.broadcastTransaction(packetData, true);
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



            var addressFrom = this.getMintingAccount().address;

                ///WHY IS TX DATA NULL HERE
          if(txData == null || txData.addressTo == addressFrom )
          {
            console.log('cant send to self!!' )
            return false;
          }

          var tx_hash = await this.transferTokensFromPool(txData.addressTo, txData.tokenAmount, resending)


    }else if(txType=="solution"){
          var currentChallengeNumber = await this.requestCurrentChallengeNumber();


              ///WHY IS TX DATA NULL HERE
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

      ///this causes big big issues need to rebroadcast

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


              var txResponse = await this.requestTransactionData(txHash)
             var receipt = await this.requestTransactionReceipt(txHash)

             if( txResponse != null )
             {
             var isPending = (txResponse.transactionIndex != null)
           }

             if(receipt!=null)
             {

               packetData.receiptData = await this.getPacketReceiptDataFromWeb3Receipt(receipt)

              await this.storeEthereumTransaction(txHash,packetData);

             }else {
               console.log('block of pending tx : ', packetData.block )

               var current_block =await this.getEthBlockNumber();
               var pending_block= packetData.block ;



                var LOST_TX_BLOCK_COUNT = 50



               //rebroadcast
               if( current_block - pending_block > LOST_TX_BLOCK_COUNT  && pending_block > 0  /* && current_block - lastRebroadcastBlock > 100  */ )
               {
                  lastRebroadcastBlock = current_block;
                  //await this.rebroadcastTransactionWithHash( txHash )
                  await this.markTransactionAsLost( txHash , packetData)
                  //this.storeEthereumTransaction(txHash,packetData);

               }

             }
       }

     }

     }catch(e)
     {
     console.log(e)
     }

      setTimeout(function(){self.updateBroadcastedTransactionStatus()},1000)
   },




      async getTransactionStatistics()
      {
        var pendingCount = 0;
        var queuedCount = 0;
        var minedCount = 0;
        var successCount = 0;

        var queuedTransactions = await this.redisInterface.getElementsOfListInRedis('queued_transactions')

        var ethereumTransactionHashes = await this.redisInterface.getResultsOfKeyInRedis('active_transactions')

        var ethereumTransactions = [];

        for(i in ethereumTransactionHashes){
          var hash = ethereumTransactionHashes[i];
        //  console.log( 'hash',hash)
          ethereumTransactions.push( await this.redisInterface.findHashInRedis('active_transactions',hash) )
        }



        var transactionPacketsData = []

        queuedTransactions.map(item => transactionPacketsData.push(JSON.parse(item)))
        ethereumTransactions.map(item => transactionPacketsData.push(JSON.parse(item)))

//        console.log('transactionPacketsData',transactionPacketsData)

        transactionPacketsData.map(function(item){

        //  console.log('item',item)


          var receiptData = item.receiptData;


          if(receiptData.pending)pendingCount++;
          if(receiptData.queued)queuedCount++;
          if(receiptData.mined)minedCount++;
          if(receiptData.success)successCount++;

        })

          this.redisInterface.storeRedisData('queuedTxCount',queuedCount);
          this.redisInterface.storeRedisData('pendingTxCount',pendingCount);
          this.redisInterface.storeRedisData('minedTxCount',minedCount);
          this.redisInterface.storeRedisData('successTxCount',successCount);

       var stats =  {
         queuedCount: queuedCount,
         pendingCount: pendingCount,
         minedCount: minedCount,
         successCount: successCount

       }

       return stats;




      },





     async requestTransactionData(tx_hash)
     {

          var data = await this.web3.eth.getTransaction(tx_hash);

          return data;
     },



   async requestTransactionReceipt(tx_hash)
   {

        var receipt = await this.web3.eth.getTransactionReceipt(tx_hash);

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
         this.redisInterface.storeRedisHashData('submitted_solution_tx',tx_hash,JSON.stringify(txData) )
      },



      async storeNewSubmittedTransferData(txHash, addressTo, balancePaymentId, tokenAmount)
      {

            var blockNumber = await this.getEthBlockNumber();


            var balanceTransferData = {
              addressTo: addressTo,
              balancePaymentId: balancePaymentId,
              tokenAmount: tokenAmount,
              txHash: txHash,
              block:blockNumber
            }

              console.log('Storing new submitted transfer data',('balance_transfers:'+addressTo.toString()),balanceTransferData)

            //helps audit payouts
          await this.redisInterface.pushToRedisList(('balance_transfers:'+addressTo.toString()), JSON.stringify(balanceTransferData)  )

        },




      //miner address
     async transferTokensFromPool(ethMinerAddress, amount,resending)
     {

          var addressTo = this.tokenContract.options.address;


          var addressFrom = this.getMintingAccount().address;
          var transferMethod = this.tokenContract.methods.transfer(addressTo,amount);


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


                   const txOptions = {
                     nonce: web3Utils.toHex(txCount),
                     gas: web3Utils.toHex(1704624),
                     gasPrice: web3Utils.toHex(web3Utils.toWei(this.poolConfig.transferGasPriceWei.toString(), 'gwei') ),
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
        nonce: web3Utils.toHex(txCount),
        gas: web3Utils.toHex(estimatedGasCost),
        gasPrice: web3Utils.toHex(web3Utils.toWei(this.poolConfig.solutionGasPriceWei.toString(), 'gwei') ),
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
     }

}
