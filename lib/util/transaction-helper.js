

const ContractHelper = require('./contract-helper.js')

var tokenContractJSON = require('../../app/assets/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../../app/assets/contracts/MintHelper.json');
var miningKingContractJSON = require('../../app/assets/contracts/MiningKing.json');

var paymentContractJSON = require('../../app/assets/contracts/BatchedPayments.json');
var deployedContractInfo = require('../../app/assets/contracts/DeployedContractInfo.json');



module.exports =  {

  init(web3,pool_env, accountConfig,redisInterface,mongoInterface)
  {
    this.pool_env=pool_env;
    this.web3=web3;
    this.accountConfig=accountConfig;
    this.mongoInterface=mongoInterface;
    this.redisInterface=redisInterface;

    this.tokenContract = ContractHelper.getTokenContract(this.web3,this.pool_env)
    this.miningKingContract = ContractHelper.getMiningKingContract(this.web3,this.pool_env)
    this.mintHelperContract = ContractHelper.getMintHelperContract(this.web3,this.pool_env)
    this.paymentContract = ContractHelper.getPaymentContract(this.web3,this.pool_env)


  },


  async submitMiningSolutionUsingMiningKing(minerAddress,solution_number,challenge_digest,challenge_number){

    var addressFrom = this.getMintingAccount().address;

    console.log( '\n' )
    console.log( '---Submitting solution for reward using mining forwarder---')
    console.log( 'nonce ',solution_number )
    console.log( 'challenge_number ',challenge_number )
    console.log( 'challenge_digest ',challenge_digest )
    console.log( '\n' )


    var mintHelperAddress = this.mintHelperContract.options.address;

   var mintMethod = this.miningKingContract.methods.mintForwarder(solution_number,challenge_digest, mintHelperAddress);

  try{
    var txCount = await this.web3.eth.getTransactionCount(addressFrom);
    console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log('error',error);

     return error;    //this will result in a resolved promise.
   }


   var addressTo = this.miningKingContract.options.address;


    var txData = this.web3.eth.abi.encodeFunctionCall({
            name: 'mintForwarder',
            type: 'function',
            inputs: [{
                type: 'uint256',
                name: 'nonce'
            },{
                type: 'bytes32',
                name: 'challenge_digest'
            },{
                type: 'address[]',
                name: 'proxyMintArray'
            }]
        }, [solution_number, challenge_digest, [mintHelperAddress] ]);



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


  //DEPRECATED
  async submitMiningSolutionWithHelper(minerAddress,solution_number,challenge_digest,challenge_number){

    var addressFrom = this.getMintingAccount().address;

    console.log( '\n' )
    console.log( '---Submitting solution for reward---')
    console.log( 'nonce ',solution_number )
    console.log( 'challenge_number ',challenge_number )
    console.log( 'challenge_digest ',challenge_digest )
    console.log( '\n' )




   var mintMethod = this.mintHelperContract.methods.proxyMint(solution_number,challenge_digest);

  try{
    var txCount = await this.web3.eth.getTransactionCount(addressFrom);
    console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log('error',error);

     return error;    //this will result in a resolved promise.
   }


   var addressTo = this.mintHelperContract.options.address;


    var txData = this.web3.eth.abi.encodeFunctionCall({
            name: 'proxyMint',
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



  //DEPRECATED
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


  async broadcastPaymentBatches()
  {

    var self = this ;


     //if we have a pending broadcasting batch just continue..
     //IMPLEMENT ^

     var broadcastedPayment = null;

      try {


        var currentEthBlock = await self.redisInterface.getEthBlockNumber();

        var REBROADCAST_WAIT_BLOCKS = 500;


        var unconfirmedBatches = await self.mongoInterface.findAll('payment_batch',{confirmed: false}   )



       for(var element of unconfirmedBatches)
       {

         ///if it has not been recently broadcasted
         if(element.broadcastedAt == null || element.broadcastedAt < (currentEthBlock - REBROADCAST_WAIT_BLOCKS)){

             var complete = await self.paymentContract.methods.paymentSuccessful(element.id).call()  ;

             //if it REALLY has never been completed before  (double check)
             if(!complete )
             {
               broadcastedPayment = await TransactionHelper.transferPaymentBatch(element)
               break; //we will broadcast just this one and that is all
             }

         }
       }
        //  var unbatched_pmnts = await this.mongoInterface.findAll('balance_payment',{batchId: null})
        // await this.batchMinedPayments( unbatched_pmnts )




      }catch(e){
       console.log('error',e)
      }


     setTimeout(function(){self.broadcastPaymentBatches()},10*60*1000)  //ten minutes

  //   return broadcastedPayment;
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

       //This is throwing up an error !
       async requestCurrentChallengeNumber()
       {

         console.log('request challenge number')

         var self = this ;
         var result =  new Promise(function (fulfilled,error) {

           self.tokenContract.methods.getChallengeNumber().call(function(err, result){
              if(err){error(err);return;}

              fulfilled(result)

            });
          });



         return result;
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








}
