 

import Web3 from 'web3'
 
import ContractHelper from './contract-helper.js'
 
 
import Web3ApiHelper from './web3-api-helper.js'
import LoggingHelper from './logging-helper.js'
 
import web3utils from 'web3-utils'
 

 
/*
  This class should only have static methods 
*/


export default class TransactionHelper  {
 

  static async submitMiningSolution(minerAddress,solution_number,challenge_digest,challenge_number, mongoInterface,poolConfig){

    let transactionType = poolConfig.mintingConfig.transactionType
    var addressFrom = poolConfig.mintingConfig.publicAddress;

    console.log( '\n' )
    console.log( '---Submitting solution for reward---')
    console.log( 'nonce ',solution_number )
    console.log( 'challenge_number ',challenge_number )
    console.log( 'challenge_digest ',challenge_digest )
    console.log( '\n' )



  
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
    //console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
 
    LoggingHelper.appendLog( [ 'txCount error',error ], LoggingHelper.TYPECODES.ERROR , mongoInterface)
    console.log('txcount error')
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
 
    var estimatedGasCost = null

    try{
      estimatedGasCost = await mintMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });

    }catch(error){
      
      
      LoggingHelper.appendLog( ['estimatedGasCostError', error], LoggingHelper.TYPECODES.ERROR, mongoInterface)

      console.log('Predicted revert ')

      return {success:false,reason:'predictedRevert'}
    }
 
    LoggingHelper.appendLog( ['sending soln tx', estimatedGasCost, txData, addressFrom, addressTo ], LoggingHelper.TYPECODES.ERROR, mongoInterface)
 


    if( estimatedGasCost > max_gas_cost){
      console.log("Gas estimate too high!  Something went wrong ")
      return;
    }


    let solutionGasPriceWei = await Web3ApiHelper.getGasPriceWeiForTxType('solution', poolConfig,mongoInterface)
    let priorityGasPriceWei = await Web3ApiHelper.getPriorityGasPriceWeiForTxType('solution', poolConfig,mongoInterface)

 
   /* let mintingGasPriceBoost = 0

    if(poolConfig && poolConfig.mintingConfig.gasPriceBoost){
      mintingGasPriceBoost = parseInt(poolConfig.mintingConfig.gasPriceBoost)
      if(isNaN(mintingGasPriceBoost)){mintingGasPriceBoost=0}
    }*/

    solutionGasPriceWei = parseInt(solutionGasPriceWei) 
    priorityGasPriceWei = parseInt(priorityGasPriceWei)

    let txOptions = {
      nonce: web3utils.toHex(txCount),
      value: 0,
      to: addressTo,
      from: addressFrom,
      data: txData
    }


    if(transactionType == "0x02"){

      txOptions.type = transactionType
      txOptions.gasLimit= web3utils.toHex(estimatedGasCost)
      txOptions.maxFeePerGas= web3utils.toHex( web3utils.toWei( solutionGasPriceWei.toString() , 'gwei' ) )
      txOptions.maxPriorityFeePerGas= web3utils.toHex( web3utils.toWei( priorityGasPriceWei.toString() , 'gwei' ) )

    }else{

      txOptions.gas = web3utils.toHex(estimatedGasCost)
      txOptions.gasPrice = web3utils.toHex(web3utils.toWei(solutionGasPriceWei.toString(), 'gwei') )
    
    }

 
  

    var privateKey = poolConfig.mintingConfig.privateKey;

    LoggingHelper.appendLog(['sendSignedRawTransactionSimple',txOptions], LoggingHelper.TYPECODES.TRANSACTIONS, mongoInterface)
       
      let txResult = await TransactionHelper.sendSignedRawTransactionSimple(web3,txOptions,addressFrom,privateKey);

      return {success:true,txResult: txResult}
  }

 



 
  static async submitBatchedPayment(txData, mongoInterface, poolConfig)
  {
    
    LoggingHelper.appendLog(['broadcasting batch payment', txData], LoggingHelper.TYPECODES.TRANSACTIONS, mongoInterface)

    let transactionType = poolConfig.paymentsConfig.transactionType
    var addressFrom = poolConfig.paymentsConfig.publicAddress;
 
    let web3 = new Web3( poolConfig.paymentsConfig.web3Provider )


 

    var tokenContract =  ContractHelper.getPaymentsTokenContract(web3, poolConfig)
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
       
      } catch(error) {  //here goes if someAsyncPromise() rejected}
        
        LoggingHelper.appendLog( [ 'txCount error',error ], LoggingHelper.TYPECODES.ERROR , mongoInterface)


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


    


   /* const txOptions = {
    nonce: web3utils.toHex(txCount),
    gas: web3utils.toHex(estimatedGasCost),
    gasPrice: web3utils.toHex(web3utils.toWei(gasPriceWei.toString(), 'gwei') ),
    value: 0,
    to: addressTo,
    from: addressFrom,
    data: txData
    }*/

    let paymentsGasPriceWei = await  Web3ApiHelper.getGasPriceWeiForTxType('batched_payment', poolConfig,mongoInterface)

    let priorityGasPriceWei = await Web3ApiHelper.getPriorityGasPriceWeiForTxType('batched_payment', poolConfig,mongoInterface)

    

    paymentsGasPriceWei = parseInt(paymentsGasPriceWei) 
    priorityGasPriceWei = parseInt(priorityGasPriceWei)
 

    

    let txOptions = {
      nonce: web3utils.toHex(txCount),
      value: 0,
      to: addressTo,
      from: addressFrom,
      data: txData
    }


    if(transactionType == "0x02"){

      txOptions.type = transactionType
      txOptions.gasLimit= web3utils.toHex(estimatedGasCost)
      txOptions.maxFeePerGas= web3utils.toHex( web3utils.toWei( paymentsGasPriceWei.toString() , 'gwei' ) )
      txOptions.maxPriorityFeePerGas= web3utils.toHex( web3utils.toWei( priorityGasPriceWei.toString() , 'gwei' ) )

    }else{

      txOptions.gas = web3utils.toHex(estimatedGasCost)
      txOptions.gasPrice = web3utils.toHex(web3utils.toWei(paymentsGasPriceWei.toString(), 'gwei') )
    
    }

 


    var privateKey = poolConfig.paymentsConfig.privateKey;
 

    LoggingHelper.appendLog(['sendSignedRawTransactionSimple',txOptions], LoggingHelper.TYPECODES.TRANSACTIONS, mongoInterface)


    let txResult= await TransactionHelper.sendSignedRawTransactionSimple(web3,txOptions,addressFrom,privateKey);

    return {success:true,txResult: txResult}
 
  
  
  }


 


 


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

   
        LoggingHelper.appendLog(['checkPendingSolutions',tx_hash], LoggingHelper.TYPECODES.TRANSACTION, mongoInterface)

         
        let transactionWasMined = TransactionHelper.transactionWasMined(transaction) //(transaction.status == 'success' || transaction.status == 'reverted')
 
        if( !transactionWasMined )
        {
          var liveTransactionReceipt = await TransactionHelper.requestTransactionReceipt(web3,tx_hash)
 
          if(liveTransactionReceipt != null )
          {


            LoggingHelper.appendLog(['got receipt',liveTransactionReceipt], LoggingHelper.TYPECODES.TRANSACTION, mongoInterface)
 
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
            LoggingHelper.appendLog( [ 'got null receipt',tx_hash], LoggingHelper.TYPECODES.WARN, mongoInterface)


          
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