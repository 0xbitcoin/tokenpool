
 //var redis = require("redis");
   var jayson = require('jayson');

   var web3utils =  require('web3-utils');

  // var redisClient;


module.exports =  {


  async init(  accountConfig, poolConfig , redisInterface, tokenInterface ,test_mode)
  {
    this.test_mode = test_mode;
    this.accountConfig =accountConfig;
    this.poolConfig=poolConfig;

    this.redisInterface=redisInterface;
    this.tokenInterface=tokenInterface;


    if(this.poolConfig.poolTokenFee == null)
    {
      console.log('Please set a poolTokenFee (% of tokens as a pool fee)')
      exit()
      return;
    }


    this.initJSONRPCServer();

    var self = this;
    setInterval( function(){ self.monitorMinedSolutions()  } , 10*1000 )

  },




   getPoolEthAddress()
   {
     return this.accountConfig.address;
   },

   getPoolMinimumShareDifficulty()
   {
     return this.poolConfig.minimumShareDifficulty;
   },

   getPoolMinimumShareTarget() //compute me
   {
     return this.getTargetFromDifficulty(this.getPoolMinimumShareDifficulty());
   },


   getTargetFromDifficulty(difficulty)
   {
     if(this.test_mode)
     {
       var max_target = web3utils.toBN( 2 ).pow( web3utils.toBN( 244 ) ) ;
     }else{
       var max_target = web3utils.toBN( 2 ).pow( web3utils.toBN( 234 ) ) ;
     }

     var current_target = max_target.div( web3utils.toBN( difficulty) );

     return current_target ;
   },


   /*
    This is the gatekeeper for solution submits
   */
   handlePeerShareSubmit(nonce,minerEthAddress,challengeNumber,digest,difficulty)
   {

     console.log('\n')
     console.log('---- received peer share submit -----')
     console.log('nonce',nonce)
     console.log('minerEthAddress',minerEthAddress)
     console.log('digest',digest)
     console.log('difficulty',difficulty)
     console.log('\n')

     var poolEthAddress = this.getPoolEthAddress();


     var poolChallengeNumber = this.tokenInterface.getPoolChallengeNumber();
     var computed_digest =  web3utils.soliditySha3( poolChallengeNumber , poolEthAddress, nonce )

     var digestBytes32 = web3utils.hexToBytes(computed_digest)
     var digestBigNumber = web3utils.toBN(computed_digest)


     var minShareTarget = web3utils.toBN(this.getPoolMinimumShareTarget() ) ;
     var miningTarget = web3utils.toBN(this.tokenInterface.getPoolDifficultyTarget() ) ;

     var claimedTarget = this.getTargetFromDifficulty( difficulty )


     console.log( 'computed_digest',computed_digest )
     console.log( 'digest',digest )
     console.log( 'digestBigNumber',digestBigNumber )

        console.log( 'claimedTarget',claimedTarget )
        console.log( 'minShareTarget',minShareTarget )

    if(computed_digest === digest && digestBigNumber.lt(minShareTarget) && digestBigNumber.lt(claimedTarget)  ){

        var shareIsASolution = digestBigNumber.lt(miningTarget)

        return this.handleValidShare( nonce,minerEthAddress,digest,difficulty, shareIsASolution );

     }else{
       console.log('invalid share digest')
       return {success: false, message: "This share digest is invalid"};

     }

   },



   async  handleValidShare( nonce,minerEthAddress,digest,difficulty, shareIsASolution )
   {
      console.log('handle valid share ')
      var existingShare = await this.redisInterface.findHashInRedis("submitted_share", digest );

        //make sure we have never gotten this digest before (redis )
      if(existingShare == null)
      {
        console.log('handle valid new share ')

        var shareData=  {nonce: nonce, miner: minerEthAddress, difficulty: difficulty, isSolution: shareIsASolution};

        //make sure this is threadsafe
        this.redisInterface.storeRedisHashData("submitted_share", digest , JSON.stringify(shareData))
        //redisClient.hset("submitted_share", digest , JSON.stringify(shareData), redis.print);

        var shareCredits =  this.getShareCreditsFromDifficulty( difficulty,shareIsASolution )

        this.awardShareCredits( minerEthAddress, shareCredits )

        var challengeNumber = this.tokenInterface.getPoolChallengeNumber();

        if( shareIsASolution )
        {
            console.log('share is a solution! ')
          this.tokenInterface.queueMiningSolution( nonce,minerEthAddress,digest,challengeNumber );
        }else{
            console.log('share is not a solution! ')
        }

        return {success: true, message: "New share credited successfully"}

      }else{
        return {success: false, message: "This share digest was already received"}
      }

   },



   async monitorMinedSolutions()
   {
     console.log('monitor mined solutions ')
     var solution_txes = await this.redisInterface.getResultsOfKeyInRedis('submitted_solution_tx')

     if( solution_txes != null && solution_txes.length > 0)
     {
        await this.checkMinedSolutions( solution_txes )



     }
    // console.log('solution_txes',solution_txes)
   },

   //checks each to see if they have been mined
   async checkMinedSolutions(solution_txes)
   {
     for(i in solution_txes)
     {
       var tx_hash = solution_txes[i];

       var transactionData = await this.loadStoredSubmittedSolutionTransaction(tx_hash)
      // console.log('transactionData',transactionData)

       if( transactionData.mined == false )
       {
         var liveTransactionReceipt = await this.tokenInterface.requestTransactionReceipt(tx_hash)

         if(liveTransactionReceipt != null )
         {
               transactionData.mined = true;

               var transaction_succeeded =  (web3utils.hexToNumber( liveTransactionReceipt.status) == 1 )

               if( transaction_succeeded )
               {
                 transactionData.succeeded = true;
                 console.log('transaction was mined and succeeded',tx_hash)
               }else {
                 console.log('transaction was mined and failed',tx_hash)
               }

               await this.saveSubmittedSolutionTransactionData(tx_hash,transactionData)
         }
       }


       if(transactionData.mined == true && transactionData.succeeded == true && transactionData.rewarded == false)
       {
         console.log( 'found unrewarded successful transaction ! ' , tx_hash  )

          var success = await this.grantTokenBalanceRewardForTransaction( tx_hash,transactionData )

          transactionData.rewarded = true;

          await this.saveSubmittedSolutionTransactionData(tx_hash,transactionData)
       }


     }



   },


     async saveSubmittedSolutionTransactionData(tx_hash,transactionData)
     {
        await this.redisInterface.storeRedisHashData('submitted_solution_tx',tx_hash,JSON.stringify(transactionData) )
     },


   async loadStoredSubmittedSolutionTransaction(tx_hash)
   {
      var txDataJSON = await this.redisInterface.findHashInRedis('submitted_solution_tx',tx_hash);
      var txData = JSON.parse(txDataJSON)
      return txData
   },



   async grantTokenBalanceRewardForTransaction(tx_hash,transactionData)
   {
     var reward_amount = transactionData.token_quantity_rewarded;

     var fee_percent =  this.poolConfig.poolTokenFee / 100.0;  // 5

     if(fee_percent > 1.0)  fee_percent = 1.0
     if(fee_percent < 0) fee_percent = 0.0


     var reward_amount_for_miners = Math.floor( reward_amount - (reward_amount * fee_percent) );

     console.log('granting',reward_amount)

     var total_shares = await this.getTotalMinerShares();

      var minerList =  await this.getMinerList()

      for(i in minerList) //reward each miner
      {
        var minerAddress = minerList[i];

        console.log('minerAddress',minerAddress)

         var minerData = await this.getMinerData(minerAddress)

         console.log('minerData',minerData)

         var miner_shares = minerData.shareCredits;

         var miner_percent_share = parseFloat(miner_shares) / parseFloat( total_shares );

         console.log('miner_percent_share',miner_percent_share)

         var tokensOwed =  Math.floor( reward_amount_for_miners * miner_percent_share );  //down to 8 decimals

         console.log('tokensOwed',tokensOwed)

         var  newTokenBalance = parseInt( minerData.tokenBalance );

         if( isNaN(newTokenBalance) )
         {
           newTokenBalance = 0;
         }

         console.log('newTokenBalance',newTokenBalance)
         newTokenBalance += tokensOwed;

         minerData.tokenBalance = newTokenBalance;
         minerData.shareCredits = 0; //wipe old shares

         console.log('tokenBalance', minerData.tokenBalance)

         this.saveMinerDataToRedis(minerAddress,minerData)


      //   var minerShares = minerData.

      }


      console.log('finished granting tokens owed ')


   },

   //need to know when one of our mining solutions SUCCEEDS
   // then we will start a new round and record tokens owed !
   checkTokenBalance()
   {



   },


   startNewMiningRound()
   {


   },

   readjustVariableDifficulties( )
   {

   },

    getShareCreditsFromDifficulty(difficulty,shareIsASolution)
   {

     var minShareDifficulty = this.getPoolMinimumShareDifficulty()  ;
     var miningDifficulty = this.tokenInterface.getPoolDifficulty()  ;

     if(shareIsASolution)//(difficulty >= miningDifficulty)
     {
       //if submitted a solution
       return 10000;
     }else if(difficulty >= minShareDifficulty)
     {
       return Math.floor( (minShareDifficulty /  miningDifficulty ) * 10000 ) ;
     }


   },


   async awardShareCredits( minerEthAddress, shareCredits )
   {
    var minerData = await this.loadMinerDataFromRedis(minerEthAddress)

     minerData.shareCredits += parseInt(shareCredits);

     console.log( 'miner data ', minerEthAddress, JSON.stringify(minerData))

     this.saveMinerDataToRedis(minerEthAddress,minerData)
   },

   async saveMinerDataToRedis(minerEthAddress, minerData)
   {
     this.redisInterface.storeRedisHashData("miner_data", minerEthAddress , JSON.stringify(minerData))

   },


   async loadMinerDataFromRedis(minerEthAddress)
   {
     var existingMinerDataJSON = await this.redisInterface.findHashInRedis("miner_data", minerEthAddress );

     if(existingMinerDataJSON == null)
     {
       existingMinerData = this.getDefaultMinerData();
     }else{
       existingMinerData = JSON.parse(existingMinerDataJSON)
     }

     return existingMinerData;
   },

   getDefaultMinerData(){
     return {
       shareCredits: 0,
       tokenBalance: 0, //what the pool owes
       varDiff: 1 //default
     }
   },


   async getTotalMinerShares()
   {
     var allMinerData = await this.getAllMinerData();


     console.log('allMinerData',allMinerData)

     var totalShares = 0;

     for(i in allMinerData)
     {
       var data = allMinerData[i].minerData

       var minerAddress = data.minerAddress;
       var minerShares = data.shareCredits;

       totalShares += minerShares;
     }

     console.log('got miner total shares', totalShares)
     return totalShares;

   },

   async getAllMinerData()
   {

     var minerList =  await this.getMinerList()

     var results = [];

     for(i in minerList)
     {
       var minerAddress = minerList[i]
       var minerData = await this.getMinerData(minerAddress)
       results.push({minerAddress: minerAddress, minerData: minerData})
     }

     return results;

   },

   async getMinerData(minerEthAddress)
   {

     var minerDataJSON = await this.redisInterface.findHashInRedis("miner_data", minerEthAddress );

     return JSON.parse(minerDataJSON) ;

   },

   async getMinerList( )
   {
       var minerData = await this.redisInterface.getResultsOfKeyInRedis("miner_data" );

       return minerData;

   },


  async initJSONRPCServer()
     {

       var self = this;

       console.log('listening on JSONRPC server localhost:8586')
         // create a server
         var server = jayson.server({
           ping: function(args, callback) {

               callback(null, 'pong');

           },
           getPoolEthAddress: function(args, callback) {

               callback(null, self.getPoolEthAddress().toString() );

           },
           getMinimumShareDifficulty: function(args, callback) {

            callback(null, self.getPoolMinimumShareDifficulty().toString() );

          },
          getMinimumShareTarget: function(args, callback) {

           callback(null, self.getPoolMinimumShareTarget().toString() );

         },
         getChallengeNumber: function(args, callback) {

          callback(null, self.tokenInterface.getPoolChallengeNumber().toString() );

        },
           submitShare: function(args, callback) {
             var nonce = args[0];
             var minerEthAddress = args[1];
             var digest = args[2];
             var difficulty = args[3];
             var challenge_number = args[4]
            callback(null, JSON.stringify( self.handlePeerShareSubmit(nonce,minerEthAddress,challenge_number,digest,difficulty ) ));

           },
           getMinerData: async function(args, callback) {

             var minerEthAddress = args[0];

             var minerData = await self.getMinerData(minerEthAddress);

             console.log('meep',minerData)
            callback(null, JSON.stringify( minerData )  );

          },
          getAllMinerData: async function(args, callback) {
            console.log('get all miner dataaa')
            var minerData = await self.getAllMinerData();

            console.log('meep',minerData)
           callback(null, JSON.stringify( minerData )  );

         },

         });

         server.http().listen(8586);

     }




}
