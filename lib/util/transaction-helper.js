const Web3 =require('web3')

const ContractHelper = require('./contract-helper.js')
const ConfigHelper = require('./config-helper.js')

var tokenContractJSON = require('../../src/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../../src/contracts/MintHelper.json');
 
var paymentContractJSON = require('../../src/contracts/BatchedPayments.json');
var deployedContractInfo = require('../../src/config/DeployedContractInfo.json');


import TokenDataHelper from './token-data-helper'
import Web3ApiHelper from './web3-api-helper'

var web3utils = require('web3-utils')

//const Tx = require('ethereumjs-tx')

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


  static async submitMiningSolution(minerAddress,solution_number,challenge_digest,challenge_number, mongoInterface,poolConfig){

    var addressFrom = poolConfig.mintingConfig.publicAddress;

    console.log( '\n' )
    console.log( '---Submitting solution for reward---')
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

   let web3 = new Web3( poolConfig.mintingConfig.web3Provider )

   var tokenContract =  ContractHelper.getTokenContract(web3, poolConfig)
   var mintMethod = tokenContract.methods.mint( solution_number,challenge_digest )
   
   //var mintMethod = this.mintHelperContract.methods.proxyMint(solution_number,challenge_digest);

  try{
    var txCount = await web3.eth.getTransactionCount(addressFrom);
    console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log('txCount error',error);

     return error;    //this will result in a resolved promise.
   }


   var addressTo = tokenContract.options.address;


    var txData = web3.eth.abi.encodeFunctionCall({
            name: 'mint',
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
    var estimatedGasCost = null

    try{
      estimatedGasCost = await mintMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });

    }catch(error){
      console.log('estimatedGasCostError', error)
   
      return {success:false,reason:'predictedRevert'}
    }

    console.log('estimatedGasCost',estimatedGasCost);
    console.log('txData',txData);

    console.log('addressFrom',addressFrom);
    console.log('addressTo',addressTo);



    if( estimatedGasCost > max_gas_cost){
      console.log("Gas estimate too high!  Something went wrong ")
      return;
    }


    let solutionGasPriceWei = await  Web3ApiHelper.getGasPriceWeiForTxType('solution', poolConfig,mongoInterface)



    const txOptions = {
      nonce: web3utils.toHex(txCount),
      gas: web3utils.toHex(estimatedGasCost),
      gasPrice: web3utils.toHex(web3utils.toWei(solutionGasPriceWei.toString(), 'gwei') ),
      value: 0,
      to: addressTo,
      from: addressFrom,
      data: txData
    }

    var privateKey = poolConfig.mintingConfig.privateKey;

      let txResult= await TransactionHelper.sendSignedRawTransactionSimple(web3,txOptions,addressFrom,privateKey);

      return {success:true,txResult: txResult}
  }

 




//FIX ME 
  static async submitBatchedPayment(txData, mongoInterface, poolConfig)
  {
    console.log('broadcasting batch payment', txData)
    
    
    var addressFrom = poolConfig.paymentsConfig.publicAddress;
 
    let web3 = new Web3( poolConfig.paymentsConfig.web3Provider )

    var tokenContract =  ContractHelper.getTokenContract(web3, poolConfig)

    let tokenAddress = tokenContract.options.address

    let dests = []
    let amounts = [] 

    for(let payment of txData.payments){
      dests.push(payment.minerEthAddress)
      amounts.push(payment.amountToPay)
    }

    var batchedPaymentsContract =  ContractHelper.getBatchedPaymentsContract(web3, poolConfig)
    var multisendMethod = batchedPaymentsContract.methods.multisend( tokenAddress, txData.uuid, dests, amounts)
   

   //do the broadcast here

      try{
        var txCount = await web3.eth.getTransactionCount(addressFrom);
        console.log('txCount',txCount)
      } catch(error) {  //here goes if someAsyncPromise() rejected}
        console.log('txCount error',error);

        return error;    //this will result in a resolved promise.
      }

      var addressTo =  batchedPaymentsContract.options.address;



      var txData = web3.eth.abi.encodeFunctionCall({
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
    }, [tokenAddress, txData.uuid, dests, amounts]);



    var max_gas_cost = 1704624;

   
    var estimatedGasCost = null

    try{
    estimatedGasCost = await multisendMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });

    }catch(error){
     console.log('estimatedGasCostError', error)

      return {success:false,reason:'predictedRevert'}
    }

    console.log('estimatedGasCost',estimatedGasCost);
    console.log('txData',txData);

    console.log('addressFrom',addressFrom);
    console.log('addressTo',addressTo);



    if( estimatedGasCost > max_gas_cost){
     console.log("Gas estimate too high!  Something went wrong ")
     return;
    }


    let gasPriceWei = await  Web3ApiHelper.getGasPriceWeiForTxType('batched_payment', poolConfig,mongoInterface)



    const txOptions = {
    nonce: web3utils.toHex(txCount),
    gas: web3utils.toHex(estimatedGasCost),
    gasPrice: web3utils.toHex(web3utils.toWei(gasPriceWei.toString(), 'gwei') ),
    value: 0,
    to: addressTo,
    from: addressFrom,
    data: txData
    }

    var privateKey = poolConfig.paymentsConfig.privateKey;

    let txResult= await TransactionHelper.sendSignedRawTransactionSimple(web3,txOptions,addressFrom,privateKey);

    return {success:true,txResult: txResult}

/*
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

      


       let paymentGasPriceWei = await this.web3apihelper.getGasPriceWeiForTxType('payment', poolConfig,mongoInterface)



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
  
  */
  
  
  }


 





  /*
   Ask the smart contract if that id is in the mapping
  */
 /*
  static async checkPendingBatchPayments( paymentContract, mongoInterface )
  {
    console.log('checkBatchPaymentsStatus')

   // paymentContract

    var unconfirmedBatches =   await  mongoInterface.findAll('payment_batch',{confirmed: false}   )

    //this type of for loop works with async & .forEach does not
    for( var element of unconfirmedBatches )   {


       var complete = await  paymentContract.methods.paymentSuccessful(element.id).call()  ;
       console.log('complete??',complete)

       if(complete)
       {
         element.confirmed = true;

         await self.markPaymentsCompleteForBatch( element )
       }

       await  mongoInterface.upsertOne('payment_batch',{id: element.id},  element  )

    }

    console.log('done w for each ')


     return true ;
  } 

*/


  static  async requestTransactionReceipt(web3, tx_hash)  //not working
  {
      try{
       var receipt = await  web3.eth.getTransactionReceipt(tx_hash);
     }catch(err)
     {
       console.error("could not find receipt ", tx_hash )
       return null;
     }
       return receipt;
  } 


    //checks each to see if they have been mined
    //rewrite this for mongo  !

     
    static async checkTransactionReceipts(txes, web3, mongoInterface)
    {
     

      for(let transaction of txes)
      {
        var tx_hash = transaction.txHash

        console.log('checkPendingSolutions', tx_hash)
 
         
        let transactionWasMined = TransactionHelper.transactionWasMined(transaction) //(transaction.status == 'success' || transaction.status == 'reverted')
 
        if( !transactionWasMined )
        {
          var liveTransactionReceipt = await TransactionHelper.requestTransactionReceipt(web3,tx_hash)
 
          if(liveTransactionReceipt != null )
          {
            console.log('got receipt',liveTransactionReceipt )
                //transactionData.mined = true;
 
                var transaction_succeeded = ((liveTransactionReceipt.status == true)
                                               || (web3utils.hexToNumber( liveTransactionReceipt.status) == 1 ))
 
                if( transaction_succeeded )
                { 
                  await TransactionHelper.updateOneTransactionById(transaction._id, {status:'success'} ,mongoInterface)
                   
                  console.log('transaction was mined and succeeded',tx_hash)
                }else {
                  await TransactionHelper.updateOneTransactionById(transaction._id, {status:'reverted'} ,mongoInterface)

                  console.log('transaction was mined and failed',tx_hash)
                }
 
                //await this.redisInterface.deleteHashInRedis('unconfirmed_submitted_solution_tx',tx_hash)
                //save as confirmed
               /// await this.saveSubmittedSolutionTransactionData(tx_hash,transactionData)
          }else{
            console.log('got null receipt',tx_hash)
          }
        }
 
        
 
 
      }
 


    } 
 
    static transactionWasMined(transaction){
     return (transaction.status == 'success' || transaction.status == 'reverted')
 
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



       static async sendSignedRawTransactionSimple(web3,txOptions,addressFrom,pKey){
          console.log('sendSignedRawTransactionSimple')
        let signedTx = await new Promise((resolve, reject) => {
          web3.eth.accounts.signTransaction(txOptions, pKey, function (error, signedTx) {
            if (error) {
               console.log(error);
            // handle error
               reject(error)
            } else {
                resolve(signedTx)
            }
    
          })
        });
    
    
    
          let submittedTx = await new Promise((resolve, reject) => {
            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', (txHash) => {
                  console.log('on tx hash: ', txHash)
                  resolve({success:true, txHash: txHash})
                })
     
          })
    
            
            console.log('submittedTx',submittedTx)
    
              return submittedTx
    
    
      }


       //change this so it is more like coinpurse cc 
 /* static async sendSignedRawTransaction(web3,txOptions,addressFrom,private_key,callback) {

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

*/
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
   /*    static async getAllUnconfirmedSubmittedSolutions(mongoInterface){
          return await mongoInterface.findAll('mint_solutions', {status: 'submitted_unconfirmed'} )
       }


       static async findNextQueuedSolution( mongoInterface ){
          return await mongoInterface.findOne('mint_solutions', {status: 'queued'})
       }


       //fix me 
       static async findNextQueuedBalancePayment( mongoInterface ){
        return await mongoInterface.findOne('balance_payments', {status: 'queued'})
     }


     static async findMintSolutionsWithQuery(query,mongoInterface){
      return await mongoInterface.findAll('mint_solutions',query)
    }*/

  static async findOneTransactionWithQuery(query,mongoInterface){
    
      return await mongoInterface.findOne('transactions',query)
      
  }

   static async findTransactionsWithQuery(query,mongoInterface){
    return await mongoInterface.findAll('transactions',query)
  }

  static async findRecentTransactionsWithQuery(query,mongoInterface){
    return await mongoInterface.findAllSortedWithLimit('transactions',query, {block: -1}, 250)
  }



  static async updateOneTransactionById(_id, newValues, mongoInterface){
    return await mongoInterface.updateAndFindOne('transactions',{_id:_id},newValues  )
  }

  //broadcasted to the network
  static async storeEthereumTransaction(tx_hash,packetData, mongoInterface)
  {

    console.log('storing data about eth tx ', tx_hash, packetData )

    
    let existingTransaction = await mongoInterface.findOne('transactions', {tx_hash: tx_hash})

    if(!existingTransaction){
      await mongoInterface.insertOne('transactions',   packetData )
    }else{
      await mongoInterface.updateOne('transactions', {tx_hash: tx_hash}, packetData )
    }


   /// await this.redisInterface.storeRedisHashData('active_transactions',tx_hash,JSON.stringify(packetData) )


    //var listPacketData = packetData;
    //listPacketData.txHash = tx_hash;

    //await this.redisInterface.pushToRedisList('active_transactions_list', JSON.stringify(listPacketData))

   /* var ethereumTransactionHashes = await this.redisInterface.getResultsOfKeyInRedis('active_transactions')

    for(i in ethereumTransactionHashes)
    {
      var txHash = ethereumTransactionHashes[i];
      if (txHash == false) exit() //emergency kill switch to debug
    }*/

    return true
  } 


  /*
   var packetData = {
       block: blockNum,
       txType: txType, //transfer or solution 
       txData: txData, 
       txHash: null,
       status: 'queued'  //queued, pending, reverted, success 

     }

  */
  static async findEthereumTransaction(tx_hash){

    let existingTransaction = await this.mongoInterface.findOne('transactions', {tx_hash: tx_hash})

    return existingTransaction
  }

}