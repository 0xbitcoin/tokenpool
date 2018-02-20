

module.exports =  {

  async init(web3,tokenContract,poolConfig,accountConfig,redisInterface,tokenInterface)
  {
    this.web3=web3;
    this.redisInterface=redisInterface;
    this.tokenContract = tokenContract;
    this.tokenInterface = tokenInterface;
    this.accountConfig= accountConfig;
    this.poolConfig= poolConfig;


      var self=this;
      //  setInterval(function(){ self.sendMiningSolutions()} , 1000)
      //  setInterval(function(){ self.sendTokenTransfers()} , 1000)

        setTimeout(function(){self.sendQueuedTransactions()},0)
  }

  /*
  KEY
  queued - transaction not broadcasted yet
  pending - transaction broadcasted but not mined
  mined - transaction mined !
  successful - transaction mined and not reverted

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

    var packetData = {txData: txdata,receiptData: receiptData}

    this.redisInterface.pushToRedisList('queued_transactions',JSON.stringify(packetData) )

  },



  async sendQueuedTransactions(contractData){
    //console.log('mine stuff')

    var self = this;

    var transactionStats = getTransactionStatistics(); // .queuedCount .pendingCount  .minedCount

    var hasPendingTransactions = (transactionStats.pendingCount > 0)
    var hasQueuedTransactions = (transactionStats.queuedCount > 0)

       if( hasQueuedTransactions && !hasPendingTransactions ){

             var nextQueuedTransactionData = this.redisInterface.popFromRedisList('queued_transactions'  )
             console.log(nextQueuedTransactionData)
             //getNextQueuedTransaction()

             broadcastTransaction(nextQueuedTransaction);

         setTimeout(function(){self.sendQueuedTransactions()},0)
       }
   },




   async requestTransactionReceipt(tx_hash)
   {
     //var mintMethod = this.tokenContract.methods.mint(solution_number,challenge_digest);

     //web3.eth.getTransaction

       var receipt = await this.web3.eth.getTransactionReceipt(tx_hash);

        //console.log('receipt ', tx_hash , receipt)

        return receipt;
   },

/*
     async sendMiningSolutions()
       {


       //  console.log( 'sendMiningSolutions' )
         if(busySendingSolution == false)
         {
           if(queuedMiningSolutions.length > 0)
           {
             busySendingSolution = true;


             var nextSolution = queuedMiningSolutions.pop();

             console.log("Popping queued mining solution " + nextSolution.toString())

             var solution_challenge_number = nextSolution.challenge_number;

             var hasSubmittedChallenge = await this.hasPendingSolutionWithChallengeNumber(solution_challenge_number)

             console.log('hasSubmittedChallenge',hasSubmittedChallenge)
               //nextSolution.challenge_number != lastSubmittedMiningSolutionChallengeNumber


             if(!hasSubmittedChallenge)
             {
             //  lastSubmittedMiningSolutionChallengeNumber =  nextSolution.challenge_number;
               //console.log('popping mining solution off stack ')

               try{
                 var txHash = await this.submitMiningSolution(nextSolution.addressFrom,
                   nextSolution.solution_number, nextSolution.challenge_digest);


                 var currentTokenMiningReward = await this.requestCurrentTokenMiningReward()

                 console.log('submitted mining solution!!',txHash ,  currentTokenMiningReward)

                 this.storeNewSubmittedSolutionTransactionHash(txHash, currentTokenMiningReward,solution_challenge_number)


               }catch(e)
               {

                 console.log(e);
               }
             }

             busySendingSolution = false;
           }
         }



       },







           async hasPendingSolutionWithChallengeNumber(challengeNumber)
           {

             console.log('has pending soln ?? ')
             var solution_txes = await this.redisInterface.getResultsOfKeyInRedis('submitted_solution_tx')

             for(i in solution_txes)
             {
               var tx_hash = solution_txes[i];

               var transactionData = await this.loadStoredSubmittedSolutionTransaction(tx_hash)


             //  console.log('transactionData', transactionData )

               if(transactionData.mined == false &&  transactionData.challengeNumber === challengeNumber  )
               {
                   console.log('has submitted soln !! ')
                 return true
               }

             }

             return false ;

           },


           //copied from peer interface
          async loadStoredSubmittedSolutionTransaction(tx_hash)
          {
             var txDataJSON = await this.redisInterface.findHashInRedis('submitted_solution_tx',tx_hash);
             var txData = JSON.parse(txDataJSON)
             return txData
          },


         async storeNewSubmittedSolutionTransactionHash(tx_hash, tokensAwarded, challengeNumber)
         {

           var txData = {
             tx_hash: tx_hash,
             challengeNumber: challengeNumber,
             mined: false,  //completed being mined ?
             succeeded: false,
             token_quantity_rewarded: tokensAwarded,
             rewarded: false   //did we win the reward of 50 tokens ?
           }

             console.log('storing submitted tx hash in redis ', tx_hash)
            this.redisInterface.storeRedisHashData('submitted_solution_tx',tx_hash,JSON.stringify(txData) )
         },



         async sendTokenTransfers()
         {

           if(queuedTokenTransfers.length > 0)
           {
             busySendingTransfer = true;

             var nextTransfer = queuedTokenTransfers.pop();

             console.log('sending xfer ', nextTransfer)

             var xfer = await this.transferTokensFromPool(nextTransfer.addressTo, nextTransfer.tokenAmount)

             console.log('token xfer',xfer)

             busySendingTransfer = false;
           }




         },


*/


   //getTransactionStatistics





   // getNextQueuedTransaction


//for vue
   //getTransactionRenderList()


  //store transaction + receipt state in redis !! (token xfers and soln submits !)





     async transferTokensFromPool(addressTo, amount)
     {
          var addressFrom = this.getPoolAccount().address;
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
               }, [addressTo, amount]);


               var max_gas_cost = 1704624;

               var estimatedGasCost = await transferMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });



                   if( estimatedGasCost > max_gas_cost){
                     console.log("Gas estimate too high!  Something went wrong ")
                     return;
                   }


                   const txOptions = {
                     nonce: web3Utils.toHex(txCount),
                     gas: web3Utils.toHex(estimatedGasCost),
                     gasPrice: web3Utils.toHex(web3Utils.toWei(this.poolConfig.gasPriceWei.toString(), 'gwei') ),
                     value: 0,
                     to: addressTo,
                     from: addressFrom,
                     data: txData
                   }

                   var privateKey =  this.getPoolAccount().privateKey;

                 return new Promise(function (result,error) {

                      this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
                       if (err) error(err)
                         result(res)
                     })

                   }.bind(this));


     },


    async submitMiningSolution(minerAddress,solution_number,challenge_digest){

      var addressFrom = this.getPoolAccount().address;

      console.log( '\n' )
      console.log( '---Submitting solution for reward---')
      console.log( 'nonce ',solution_number )
      console.log( 'challenge_digest ',challenge_digest )
      console.log( '\n' )

     var mintMethod = this.tokenContract.methods.mint(solution_number,challenge_digest);

    try{
      var txCount = await this.web3.eth.getTransactionCount(addressFrom);
      console.log('txCount',txCount)
     } catch(error) {  //here goes if someAsyncPromise() rejected}
      console.log(error);

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
        gasPrice: web3Utils.toHex(web3Utils.toWei(this.poolConfig.gasPriceWei.toString(), 'gwei') ),
        value: 0,
        to: addressTo,
        from: addressFrom,
        data: txData
      }

      var privateKey =  this.getPoolAccount().privateKey;

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
          console.log(e);
        }
    },


     truncate0xFromString(s)
    {
      if(s.startsWith('0x')){
        return s.substring(2);
      }
      return s;
    },

     getPoolAccount()
     {
       return this.accountConfig;
     }

}
