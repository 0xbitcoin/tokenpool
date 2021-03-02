

const ContractHelper = require('./contract-helper.js')
const ConfigHelper = require('./config-helper.js')

var tokenContractJSON = require('../../app/assets/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../../app/assets/contracts/MintHelper.json');
//var miningKingContractJSON = require('../../app/assets/contracts/MiningKing.json');

var paymentContractJSON = require('../../app/assets/contracts/BatchedPayments.json');
var deployedContractInfo = require('../../app/assets/contracts/DeployedContractInfo.json');




var web3utils = require('web3-utils')

const Tx = require('ethereumjs-tx')

//const poolConfig = require('../../pool.config').config
//const accountConfig = require('../../account.config').config


/*
  This class should only have static methods 
*/


export default class TransactionHelper  {

 /* init(web3,pool_env,  redisInterface,mongoInterface,web3apihelper)
  {
    this.pool_env=pool_env;
    this.web3=web3;

    this.web3apihelper = web3apihelper

    this.mongoInterface=mongoInterface;
    this.redisInterface=redisInterface;
    this.accountConfig=ConfigHelper.getAccountConfig(this.pool_env)

    this.tokenContract = ContractHelper.getTokenContract(this.web3,this.pool_env)
    //this.miningKingContract = ContractHelper.getMiningKingContract(this.web3,this.pool_env)
    this.mintHelperContract = ContractHelper.getMintHelperContract(this.web3,this.pool_env)
    this.paymentContract = ContractHelper.getPaymentContract(this.web3,this.pool_env)
    //this.doubleKingsRewardContract = ContractHelper.getDoubleKingsRewardContract(this.web3,this.pool_env)

  },*/


  static async submitMiningSolutionTwo(minerAddress,solution_number,challenge_digest,challenge_number, mongoInterface){

    var addressFrom = this.getMintingAccount().address;

    console.log( '\n' )
    console.log( '---Submitting solution for reward using mining forwarder---')
    console.log( 'nonce ',solution_number )
    console.log( 'challenge_number ',challenge_number )
    console.log( 'challenge_digest ',challenge_digest )
    console.log( '\n' )



  //  var doubleKingsRewardAddress = this.doubleKingsRewardContract.options.address;
    //var mintHelperAddress = this.mintHelperContract.options.address;

/*

    //Choose which proxyMint contracts to run
   var cascadingMintArray = [
     doubleKingsRewardAddress,
     mintHelperAddress
   ]
   // --------------------------------------



   var mintMethod = this.miningKingContract.methods.mintForwarder(solution_number,challenge_digest, cascadingMintArray);
   */

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
            } ]
        }, [solution_number, challenge_digest ]);



    var max_gas_cost = 1704624;

    //having an issue ?
    var estimatedGasCost = await mintMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });


    console.log('estimatedGasCost',estimatedGasCost);
    console.log('txData',txData);

    console.log('addressFrom',addressFrom);
    console.log('addressTo',addressTo);



    if( estimatedGasCost > max_gas_cost){
      console.log("Gas estimate too high!  Something went wrong ")
      return;
    }


    let solutionGasPriceWei = await this.web3apihelper.getGasPriceWeiForTxType('solution')



    const txOptions = {
      nonce: web3utils.toHex(txCount),
      gas: web3utils.toHex(estimatedGasCost),
      gasPrice: web3utils.toHex(web3utils.toWei(solutionGasPriceWei.toString(), 'gwei') ),
      value: 0,
      to: addressTo,
      from: addressFrom,
      data: txData
    }

    var privateKey =  this.getMintingAccount().privateKey;

  return new Promise(function (result,error) {

       TransactionHelper.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
        if (err) error(err)
          result(res)
      })

    }.bind(this));


  },


  //DEPRECATED
/*  async submitMiningSolutionWithHelper(minerAddress,solution_number,challenge_digest,challenge_number){

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


    let solutionGasPriceWei = await this.web3apihelper.getGasPriceWeiForTxType('solution')


    const txOptions = {
      nonce: web3utils.toHex(txCount),
      gas: web3utils.toHex(estimatedGasCost),
      gasPrice: web3utils.toHex(web3utils.toWei(solutionGasPriceWei.toString(), 'gwei') ),
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


  },*/



  //DEPRECATED
 /* async submitMiningSolutionOld(minerAddress,solution_number,challenge_digest,challenge_number,resending){

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



   let solutionGasPriceWei = await this.web3apihelper.getGasPriceWeiForTxType('solution')


   const txOptions = {
     nonce: web3utils.toHex(txCount),
     gas: web3utils.toHex(estimatedGasCost),
     gasPrice: web3utils.toHex(web3utils.toWei(solutionGasPriceWei.toString(), 'gwei') ),
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


  },*/








  static async transferPaymentBatch(batchPayment)
  {
    console.log('broadcasting batch payment', batchPayment)

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

   if(paymentsInBatch.length <= 0 )
   {
     console.log('no payments in this batch')
     return
   }


   for(var payment of paymentsInBatch)
   {
       //if is valid
     if(web3utils.isAddress( payment.minerAddress )   )
     {
       toAddressArray.push(payment.minerAddress)
       toValueArray.push(payment.amountToPay) //get in satoastis ?

     }else{
       console.log('WARNING: Detected invalid payout address:',payment.minerAddress)

     }


   }



   try{
     var txCount = await this.web3.eth.getTransactionCount(addressFrom);
     console.log('txCount',txCount)
    } catch(error) {  //here goes if someAsyncPromise() rejected}
     console.log('err', error);

      return error;    //this will result in a resolved promise.
    }





    console.log('from to ', addressFrom, addressTo, )
    console.log('tx payment batch', [tokenAddress,   batchPayment.id, toAddressArray, toValueArray])

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

       var max_gas_cost = 17004624;


      // try{

         var transferMethod = this.paymentContract.methods.multisend(tokenAddress,batchPayment.id, toAddressArray, toValueArray);

         console.log('from',addressFrom)

         var estimatedGasCost = await transferMethod.estimateGas({  gas: max_gas_cost, from:addressFrom, to: addressTo });


         if( estimatedGasCost > max_gas_cost){
           console.log("Gas estimate too high!  Something went wrong ")
           return;
         }else {
           console.log('estimated gas ', estimatedGasCost)
         }

      /* }catch(e){
         console.error(e);
         estimatedGasCost = max_gas_cost;
       }*/


       let paymentGasPriceWei = await this.web3apihelper.getGasPriceWeiForTxType('payment')



       const txOptions = {
         nonce: web3utils.toHex(txCount),
         gas: web3utils.toHex( estimatedGasCost ),
         gasPrice: web3utils.toHex(web3utils.toWei(paymentGasPriceWei.toString(), 'gwei') ),
         value: 0,
         to: addressTo,
         from: addressFrom,
         data: txData
       }

       var txHash = await new Promise(function (result,error) {

            TransactionHelper.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
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
  }


  static async broadcastPaymentBatches()
  {

    var self = this ;


     //if we have a pending broadcasting batch just continue..
     //IMPLEMENT ^

     var broadcastedPayment = null;

      try {


        var currentEthBlock = await self.redisInterface.getEthBlockNumber();

        var REBROADCAST_WAIT_BLOCKS = Math.min(10, poolConfig.rebroadcastPaymentWaitBlocks);


        var unconfirmedBatches = await self.mongoInterface.findAll('payment_batch',{confirmed: false}   )



       for(var element of unconfirmedBatches)
       {

         console.log('checking batch for transfer - ', element.id, element.broadcastedAt , currentEthBlock )
         ///if it has not been recently broadcasted
         if(element.broadcastedAt == null || element.broadcastedAt < (currentEthBlock - REBROADCAST_WAIT_BLOCKS)){

             var complete = await self.paymentContract.methods.paymentSuccessful(element.id).call()  ;

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


     setTimeout(function(){self.broadcastPaymentBatches()},10*60*1000)  //ten minutes

  //   return broadcastedPayment;
  } 






  /*
   Ask the smart contract if that id is in the mapping
  */
  static async checkBatchPaymentsStatus()
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
  } 



       static async markPaymentsCompleteForBatch(batchPayment)
       {

         var self = this;
         //await self.mongoInterface.upsertOne('balance_payment',{id: element.id},  element  )
        // var paymentsForBatch =   await self.mongoInterface.findAll('balance_payment',{batchId: false}   )
         var paymentsForBatch = await self.mongoInterface.findAll('balance_payment',{batchId: batchPayment.id})


         for( var element of paymentsForBatch )   {

            element.txHash = batchPayment.txHash;
            element.confirmed = batchPayment.confirmed;
            element.broadcastedAt = batchPayment.broadcastedAt;

           await self.mongoInterface.upsertOne('balance_payment',{id: element.id},  element  )

         }

         return true;
       } 



        //DEPRECATED
     /*  async transferTokensFromPool(addressFromType, ethMinerAddress, amount, balancePaymentId, resending)
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
              console.log('err', error);

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



                     let paymentGasPriceWei = await this.web3apihelper.getGasPriceWeiForTxType('payment')



                     const txOptions = {
                       nonce: web3utils.toHex(txCount),
                       gas: web3utils.toHex(1704624),
                       gasPrice: web3utils.toHex(web3utils.toWei(paymentGasPriceWei.toString(), 'gwei') ),
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


       },*/

       //This is throwing up an error ?
      static  async requestCurrentChallengeNumber()
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
       } 





       //change this so it is more like coinpurse cc 
  static async sendSignedRawTransaction(web3,txOptions,addressFrom,private_key,callback) {

   var privKey = TransactionHelper.truncate0xFromString( private_key )

   const privateKey = Buffer.from( privKey, 'hex')
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
  } 



  static  truncate0xFromString(s)
      {
        if(s.startsWith('0x')){
          return s.substring(2);
        }
        return s;
      } 


/*
       getMintingAccount()
       {
         return this.accountConfig.minting;
       },

       getPaymentAccount()
       {
         return this.accountConfig.payment;
       },*/



       //FIX ME 
       static async getAllUnconfirmedSubmittedSolutions(mongoInterface){
          return await mongoInterface.findAll('submitted_solutions', {status: 'unconfirmed'} )
       }


}
