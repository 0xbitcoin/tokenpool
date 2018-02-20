


const Tx = require('ethereumjs-tx')

var tokenContractJSON = require('../app/assets/contracts/_0xBitcoinToken.json');
var deployedContractInfo = require('../app/assets/contracts/DeployedContractInfo.json');
var web3Utils = require('web3-utils')


var busySendingSolution = false;
var queuedMiningSolutions = [];


//var lastSubmittedMiningSolutionChallengeNumber;


/**
BUG : pool is resending transactions!

**/




module.exports =  {


  async init(redisInterface, web3, accountConfig, poolConfig, test_mode )
  {
    this.redisInterface=redisInterface;
    this.web3=web3;
    this.test_mode = test_mode;
    this.poolConfig = poolConfig;
    this.accountConfig=accountConfig;
    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress())



  //  this.difficultyTarget = 111;
    //this.challengeNumber = 1111;

    await this.collectTokenParameters();

    var self=this;
    setInterval(function(){ self.collectTokenParameters()},2000);


    busySendingSolution = false;

    setInterval(function(){ self.sendMiningSolutions()} , 1000)


    //every hour
    setInterval(function(){ self.transferTokensForBalances()} , 1 * 60 * 60 * 1000)

      await self.transferTokensForBalances()


  },

  getPoolChallengeNumber()
  {
    return this.challengeNumber;
  },

  getPoolDifficultyTarget()
  {
    return this.difficultyTarget;
  },

  getPoolDifficulty()
  {
    return this.miningDifficulty;
  },


  async collectTokenParameters( )
  {


    var miningDifficultyString = await this.tokenContract.methods.getMiningDifficulty().call()  ;
    var miningDifficulty = parseInt(miningDifficultyString)

    var miningTargetString = await this.tokenContract.methods.getMiningTarget().call()  ;
    var miningTarget = web3Utils.toBN(miningTargetString)

    var challengeNumber = await this.tokenContract.methods.getChallengeNumber().call() ;

    console.log('Mining difficulty:', miningDifficulty);
    console.log('Challenge number:', challengeNumber)

      this.miningDifficulty = miningDifficulty;
      this.difficultyTarget = miningTarget;
      this.challengeNumber = challengeNumber;

  },

  getTokenContractAddress()
  {
    if(this.test_mode)
    {
      return deployedContractInfo.networks.testnet.contracts._0xbitcointoken.blockchain_address;
    }else{
      return deployedContractInfo.networks.mainnet.contracts._0xbitcointoken.blockchain_address;
    }

  },




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


  async queueMiningSolution( solution_number,addressFrom,challenge_digest,challenge_number )
  {
    console.log('queueMiningSolution ')
    queuedMiningSolutions.push({
      addressFrom: addressFrom,    //we use this differently in the pool!
      solution_number: solution_number,
      challenge_digest: challenge_digest,
      challenge_number: challenge_number
    });

  },


  //IMPLEMENT ME

  async transferTokensForBalances()
  {
    console.log('transfer tokens to all those with over 1 0xBTC balance ' )

    var min_balance_for_transfer = this.poolConfig.minBalanceForTransfer; //this is in token-satoshis

    //for each miner


  var minerList =  await this.getMinerList()

    for(i in minerList) //reward each miner
    {
      var minerAddress = minerList[i];

       var minerData = await this.getMinerData(minerAddress)

       var miner_token_balance = minerData.tokenBalance;

       minerData.tokenBalance = 0;

       this.saveMinerDataToRedis(minerAddress,minerData)

       if(miner_token_balance > min_balance_for_transfer)
       {

         var xfer = await this.transferTokensFromPool(minerAddress,miner_token_balance)

         console.log('xfer',xfer)
       }

    }

    //if balance is higher than this

    //drain their balance and send that many tokens to them


  },

  async saveMinerDataToRedis(minerEthAddress, minerData)
  {
    this.redisInterface.storeRedisHashData("miner_data", minerEthAddress , JSON.stringify(minerData))

  },

  async getMinerData(minerEthAddress)
  {

    var minerDataJSON = await this.redisInterface.findHashInRedis("miner_data", minerEthAddress );

    return JSON.parse(minerDataJSON) ;

  },


  //copied from peer
  async getMinerList( )
  {
      var minerData = await this.redisInterface.getResultsOfKeyInRedis("miner_data" );

      return minerData;

  },

   async requestTransactionReceipt(tx_hash)
   {
     //var mintMethod = this.tokenContract.methods.mint(solution_number,challenge_digest);

     //web3.eth.getTransaction

       var receipt = await this.web3.eth.getTransactionReceipt(tx_hash);

        //console.log('receipt ', tx_hash , receipt)

        return receipt;
   },


   async requestCurrentTokenMiningReward()
   {


     var self = this ;
     var reward_amount =  new Promise(function (fulfilled,error) {

       self.tokenContract.methods.getMiningReward().call(function(err, result){
          if(err){error(err);return;}

          fulfilled(result)

        });
      });



     return reward_amount;
   },



   async transferTokensFromPool(addressTo, amount)
   {
        var addressFrom = this.getPoolAccount().address;
        var transferMethod = this.tokenContract.methods.transfer(recipientAddress,amount);


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

             var estimatedGasCost = await mintMethod.transferMethod({gas: max_gas_cost, from:addressFrom, to: addressTo });



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
