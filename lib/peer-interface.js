
 //var redis = require("redis");
   var jayson = require('jayson');

   var web3utils =  require('web3-utils');

   //var peerUtils = require('./peer-utils')


  import PeerHelper from './util/peer-helper'
  import TokenDataHelper from './util/token-data-helper';
  import TransactionHelper from './util/transaction-helper';

    var Web3 = require('web3')

   var deployedContractInfo = require('../src/config/DeployedContractInfo.json');

   const ContractHelper = require('./util/contract-helper')

  // var redisClient;

  const UPDATE_VAR_DIFF_PERIOD = 30 * 1000; //30 seconds


  //const UPDATE_HASH_RATE_PERIOD = 4 * 60  * 1000;

  const SOLUTION_FINDING_BONUS = 0;
  var varDiffPeriodCount = 0;

  //const poolConfig = require('../pool.config').config


export default class PeerInterface  {

  constructor(mongoInterface, poolConfig){
    this.mongoInterface=mongoInterface;
    this.poolConfig=poolConfig;

    this.web3 = new Web3(poolConfig.mintingConfig.web3Provider);
    this.tokenContract = ContractHelper.getTokenContract(this.web3, this.poolConfig.poolEnv ) //FIX ME 


    if(this.poolConfig.mintingConfig.poolTokenFee == null)
    {
      console.error('Please set a poolTokenFee (% of tokens as a pool fee)')
      throw 'Please set a poolTokenFee (% of tokens as a pool fee)'

       
    }

    if(this.poolConfig.communityTokenFee == null)
    {
      this.poolConfig.communityTokenFee = 0;
    }

  } 





/*
  async init( web3, accountConfig,  redisInterface, mongoInterface, tokenInterface ,pool_env)
  {
    this.pool_env = pool_env;
    this.web3=web3;
    this.accountConfig =accountConfig;
    this.poolConfig=poolConfig;

    this.redisInterface=redisInterface;
    this.mongoInterface=mongoInterface;

    this.tokenInterface=tokenInterface;


    if(this.poolConfig.poolTokenFee == null)
    {
      console.log('Please set a poolTokenFee (% of tokens as a pool fee)')
      exit()
      return;
    }

    if(this.poolConfig.communityTokenFee == null)
    {
      this.poolConfig.communityTokenFee = 0;
    }


  },*/

  async listenForJSONRPC()
  {

        this.initJSONRPCServer();

  } 

  async update()
  {

 

    setInterval(function(){this.processQueuedShares(this.mongoInterface)}.bind(this),4000)

     setInterval(function(){this.monitorMinedSolutions(this.mongoInterface)}.bind(this),4000)


    //Error


    setInterval(function(){PeerInterface.calculateMinerHashrateData(this.mongoInterface)}.bind(this), 4000)

  } 


    //refactor 
    //write a test !! 
  async processQueuedShares(mongoInterface)
  {
    

    let shareDataResult  = await mongoInterface.findAndDeleteOne('queued_shares_list', {} )  //this.redisInterface.popFromRedisList("queued_shares_list")

    let shareData = shareDataResult.value 
    
    console.log('share data to process', shareData)
    //var shareData = JSON.parse(shareDataJSON)

    //console.log('process queued shares')

    if(typeof shareData != 'undefined' && shareData != null)
    {
      try{
        var response =  await PeerInterface.handlePeerShareSubmit(shareData.nonce,shareData.minerEthAddress,shareData.challengeNumber,shareData.digest,shareData.difficulty,shareData.customVardiff, mongoInterface );
        }catch(err)
        {
          console.log('handle share error: ',err);
        }
      }else {
       // console.log('WARNING: share data undefined')
      }
    //  setTimeout(function(){this.processQueuedShares()}.bind(this),0)

  } 


  async monitorMinedSolutions( mongoInterface )
  {

    var self = this ;

   try {
    console.log('monitor mined solutions ')
   // var solution_txes = await this.redisInterface.getResultsOfKeyInRedis('unconfirmed_submitted_solution_tx')
    let solution_txes = await TransactionHelper.getAllUnconfirmedSubmittedSolutions(mongoInterface)


    if( solution_txes != null && solution_txes.length > 0)
    {
       var response = await this.checkMinedSolutions( solution_txes )
    }
   }catch(e)
   {
   console.log('error',e)
    }

    // setTimeout(function(){this.monitorMinedSolutions( mongoInterface )}.bind(this),4000)

  } 



   /*
   This does avg hashrate calcs and the vardiff

   */
  static async calculateMinerHashrateData(mongoInterface)
  {
 

          var minerList =  await PeerHelper.getMinerList( mongoInterface )

         //  console.log( 'calculateMinerHashrateData', minerList )

          for(i in minerList) //reward each miner
          {
            var minerAddress = minerList[i];

            var sharesData = await this.getSharesData(minerAddress)

            if(sharesData == null) continue;

         //   var newVarDiff = await this.getUpdatedVarDiffForMiner(sharesData,minerAddress)

           var minDiff = self.getPoolMinimumShareDifficulty();

           sharesData.miningDifficulty = minDiff


            sharesData.hashRate = await this.estimateMinerHashrate(minerAddress )

           // sharesData.varDiff = newVarDiff;
            sharesData.validSubmittedSolutionsCount = 0;  //reset

            await this.saveSharesData(minerAddress,sharesData);
           }

         varDiffPeriodCount++;

       //  setTimeout(function(){self.calculateMinerHashrateData()},4000  )///perform after booting
    //    setTimeout(function(){PeerInterface.calculateMinerHashrateData(mongoInterface)}.bind(this),UPDATE_VAR_DIFF_PERIOD  )  // 1 minute
  } 

/*
  

   getPoolMaximumShareDifficulty()  //DEPRECATED
   {
     return this.poolConfig.maximumShareDifficulty;
   } */

  /* async getMinerVarDiff(minerEthAddress)
   {
     if( minerEthAddress == null ||  typeof minerEthAddress == 'undefined' || !web3utils.isAddress(minerEthAddress))
     {
       var poolMinDiff = this.getPoolMinimumShareDifficulty();
       return  poolMinDiff;
     }

     minerEthAddress = minerEthAddress.toString().toLowerCase()

     var sharesData = await this.getSharesData(minerEthAddress)

     var varDiff = 1;

     if(sharesData)
     {
       var varDiff = sharesData.varDiff;

       if(varDiff < this.getPoolMinimumShareDifficulty())
       {
         varDiff = this.getPoolMinimumShareDifficulty();
       }
     }


     return varDiff;
   } */

 

   /*
    This is the gatekeeper for solution submits
   */
   static async handlePeerShareSubmit(nonce,minerEthAddress,challengeNumber,digest,difficulty,mongoInterface)
   {

     console.log('got new share from miner ', minerEthAddress, ' ', nonce)

     /*
     console.log('\n')
     console.log('---- received peer share submit -----')
     console.log('nonce',nonce)
     console.log('challengeNumber',challengeNumber)
     console.log('minerEthAddress',minerEthAddress)
     console.log('digest',digest)
     console.log('difficulty',difficulty)
     console.log('\n')
     */

     if( difficulty == null  ) return ;
     if( nonce == null  ) return ;
     if( minerEthAddress == null  ) return ;
     if( challengeNumber == null  ) return ;
     if( digest == null  ) return ;


     var poolEthAddress = this.getMintHelperAddress();


     var poolChallengeNumber = await this.tokenInterface.getPoolChallengeNumber();

 

         console.log('sha3inputs ', [  poolChallengeNumber , poolEthAddress, nonce  ])

     var computed_digest =  web3utils.soliditySha3( poolChallengeNumber , poolEthAddress, nonce )
          console.log ( 'computed_digest', computed_digest)


     var digestBytes32 = web3utils.hexToBytes(computed_digest)
     var digestBigNumber = web3utils.toBN(computed_digest)


     var minShareTarget = web3utils.toBN(this.getPoolMinimumShareTarget() ) ;
     var miningTarget = web3utils.toBN(await this.tokenInterface.getPoolDifficultyTarget() ) ;

     var claimedTarget = this.getTargetFromDifficulty( difficulty )



     //var varDiff = await this.getMinerVarDiff(minerEthAddress);
     let varDiff = await this.getPoolMinimumShareDifficulty()



     /*
      SHOULD BE USING THE PARAMETER customVardiff  BUT WILL WAIT FOR MINERS TO IMPLEMENT
     */
    // var usingCustomDifficulty = (difficulty != varDiff);

 


    var minShareDifficulty = this.getPoolMinimumShareDifficulty()  ;




    if(computed_digest === digest &&
       difficulty >= minShareDifficulty &&
       digestBigNumber.lt(claimedTarget)  ){

        var shareIsASolution = digestBigNumber.lt(miningTarget)

        return await this.handleValidShare( nonce,
                                            minerEthAddress,
                                            digest,
                                            difficulty,
                                            shareIsASolution );

     }else{
       if(computed_digest !== digest) console.log(' bad digest ', computed_digest, digest)
       if(difficulty < minShareDifficulty) console.log(' bad diff ', difficulty, minShareDifficulty)
       if( digestBigNumber.lt(claimedTarget) == false) console.log(' not less than target  ', claimedTarget)


       var ethBlock = await this.redisInterface.getEthBlockNumber()

       var shareData =  {
         block: ethBlock,
         nonce: nonce,
         miner: minerEthAddress,
         difficulty: difficulty,
         time: PeerHelper.getUnixTimeNow()
        };

       //await this.redisInterface.storeRedisHashData("invalid_share", digest , JSON.stringify(shareData))
     
     
       await this.redisInterface.pushToRedisList("miner_invalid_share:"+minerEthAddress.toString().toLowerCase(),  JSON.stringify(shareData))
           //await mongoInterface.  //IMPLEMENT ME 


       return {success: false, message: "This share digest is invalid"};

     }

   } 



  static async  handleValidShare( nonce,minerEthAddress,digest,difficulty, shareIsASolution, mongoInterface )
   {
      console.log('handle valid share ')
      var existingShare = await this.redisInterface.findHashInRedis("submitted_share", digest );

        //make sure we have never gotten this digest before (redis )
      if(existingShare == null && minerEthAddress!=null)
      {
        console.log('handle valid new share ')
        var ethBlock = await this.redisInterface.getEthBlockNumber()


        var minerData = await this.getMinerData(minerEthAddress.toString().toLowerCase())

        // minerData.usingCustomDifficulty = usingCustomDifficulty;

         await this.saveMinerDataToRedisMongo(minerEthAddress,minerData)

        if(minerData.lastSubmittedSolutionTime != null)
        {
            var timeToFindShare = (PeerHelper.getUnixTimeNow() - minerData.lastSubmittedSolutionTime);
        }else{
           //make sure we check for this later
            var timeToFindShare = 0;
        }

        var difficultyBN = web3utils.toBN(difficulty);

        var shareData=  {
          block: ethBlock,
          nonce: nonce,
          miner: minerEthAddress,
          difficulty: difficulty,
          isSolution: shareIsASolution,
          hashRateEstimate: this.getEstimatedShareHashrate(difficultyBN,timeToFindShare),
          time: PeerHelper.getUnixTimeNow(),
          timeToFind: timeToFindShare  //helps estimate hashrate- look at recent shares
        };

        //make sure this is threadsafe
        await this.redisInterface.storeRedisHashData("submitted_share", digest , JSON.stringify(shareData))
        //await this.redisInterface.setKeyExpiration("submitted_share", 60*60*24  )


        await this.redisInterface.pushToRedisList("miner_submitted_share:"+minerEthAddress.toString().toLowerCase(),  JSON.stringify(shareData))

        await this.redisInterface.pushToRedisList("submitted_shares_list", JSON.stringify(shareData))

        if(shareIsASolution)
        {
          await this.redisInterface.pushToRedisList("submitted_solutions_list", JSON.stringify(shareData))
        }

        //redisClient.hset("submitted_share", digest , JSON.stringify(shareData), redis.print);

        var shareCredits =  await this.getShareCreditsFromDifficulty( difficulty,shareIsASolution )

        await this.awardShareCredits( minerEthAddress, shareCredits )

        //GIANT ISSUE IF AWAIT IS MISSING
        var challengeNumber = await this.tokenInterface.getPoolChallengeNumber();

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

   } 







   //TimeToSolveBlock (seconds) = difficulty * 2^22 / hashrate (hashes per second)


   //hashrate = (difficulty * 2^22) / timeToSolveABlock seconds)
 

   //we expect a solution per minute ??
   //DEPRECATED
 /*  async getUpdatedVarDiffForMiner(sharesData,minerAddress)
   {
      var minerVarDiff = sharesData.varDiff;
      var poolMinDiff = this.getPoolMinimumShareDifficulty();
      var poolMaxDiff = this.getPoolMaximumShareDifficulty();

      var avgFindingTime = await this.getAverageSolutionTime(minerAddress);

      //dont modify if using custom
       

      sharesData.avgFindingTime = avgFindingTime;

      var expectedFindingTime = 60;//seconds



      if( sharesData.validSubmittedSolutionsCount > 0 && avgFindingTime!= null ){
           if( avgFindingTime < expectedFindingTime * 0.9 ){
                minerVarDiff = Math.ceil(minerVarDiff * 1.2 ); //harder
           }else if( avgFindingTime > expectedFindingTime * 1.1 ){
                minerVarDiff = Math.ceil(minerVarDiff / 1.2 ); //easier
           }
      }

      if( minerVarDiff <  poolMinDiff ){
           minerVarDiff = poolMinDiff;
      }


      if( minerVarDiff > poolMaxDiff ){
           minerVarDiff = poolMaxDiff;
      }

      return minerVarDiff;
   },*/

  

   ///This should clean mongo data ! 
   async cleanRedisData( mongoInterface )
   {
     var self = this;


     //loop through each miner
     var minerList =  await PeerHelper.getMinerList(mongoInterface)

     console.log('remove extra data for ',minerList.length, ' miners ')
     for(i in minerList)
     {
       var minerEthAddress = minerList[i];

       if(minerEthAddress == null)continue;

       await this.redisInterface.removeFromRedisListToLimit("miner_invalid_share:"+minerEthAddress.toString().toLowerCase(),50);
       await this.redisInterface.removeFromRedisListToLimit("submitted_shares_list",50);
       await this.redisInterface.removeFromRedisListToLimit("miner_submitted_share:"+minerEthAddress.toString().toLowerCase(),400);
     }


     var currentEthBlock = await this.redisInterface.getEthBlockNumber();

     var DIGESTS_LIFETIME_BLOCKS = 1000;


      var submittedSharesKeys = await this.redisInterface.getResultsOfKeyInRedis("submitted_share" );


    for(i in submittedSharesKeys)
     {
       var digest = submittedSharesKeys[i];
       var submittedShareDataJSON = await this.redisInterface.findHashInRedis("submitted_share", digest)
       var submittedShareData =JSON.parse(submittedShareDataJSON)

       if( submittedShareData.block < (currentEthBlock-DIGESTS_LIFETIME_BLOCKS) )
       {

         await this.redisInterface.deleteHashInRedis("submitted_share", digest)
       }
     }

     console.log('done!!')
     return;

     //setTimeout(function(){self.cleanRedisData()},60 * 1000)
   } 

  





 


/*
   async queueBalancePayment(paymentData)
   {
     var balancePaymentId = paymentData.balancePaymentId;

    // var existingReplacementPayment = await this.redisInterface.findHashInRedis('queued_replacement_payment',balancePaymentId)

     var currentEthBlock = await this.redisInterface.getEthBlockNumber();



     //make sure only one replacement tx is being queued
  //   if( existingReplacementPayment == null   )
  //   {
        //paymentData.last_broadcast_block = currentEthBlock;
        await this.redisInterface.storeRedisHashData('queued_balance_payment' ,balancePaymentId ,JSON.stringify(paymentData) )
        console.log('queue balance payment');


        //create a new queued transfer
        // if(this.pool_env == "staging")
        // {
            await this.tokenInterface.queueTokenTransfer('payment', paymentData.addressTo, paymentData.tokenAmount, paymentData.balancePaymentId)
      //   }

//}


   },
*/




   //need to know when one of our mining solutions SUCCEEDS
   // then we will start a new round and record tokens owed !
   /*checkTokenBalance()
   {



   },*/




  async  getShareCreditsFromDifficulty(difficulty,shareIsASolution)
   {

     var minShareDifficulty = this.getPoolMinimumShareDifficulty()  ;
     var miningDifficulty = parseFloat( await this.tokenInterface.getPoolDifficulty() ) ;

     if(shareIsASolution)//(difficulty >= miningDifficulty)
     {
       //if submitted a solution
      // return 10000;

      var amount = Math.floor( difficulty   ) ;
       console.log('credit amt ', amount,minShareDifficulty,miningDifficulty )

       amount += SOLUTION_FINDING_BONUS;
       return amount;

     }else if(difficulty >= minShareDifficulty)
     {

       var amount = Math.floor(  difficulty    ) ;
       console.log('credit amt ', amount,minShareDifficulty,miningDifficulty )
       return amount;
     }

     console.log('no shares for this solve!!',difficulty,minShareDifficulty)

     return 0;
   } 


   async awardShareCredits( minerEthAddress, shareCredits )
   {

     console.log('awarding shares : ' + shareCredits )
    var sharesData = await this.getSharesData(minerEthAddress)

    if( sharesData.shareCredits == null || isNaN(sharesData.shareCredits)) sharesData.shareCredits = 0
    if( shareCredits == null || isNaN(shareCredits)) shareCredits = 0




     sharesData.shareCredits += parseInt(shareCredits);
     sharesData.validSubmittedSolutionsCount += 1;
     sharesData.lastSubmittedSolutionTime = PeerHelper.getUnixTimeNow();

     console.log( 'miner data - award shares ', minerEthAddress, JSON.stringify(sharesData))

     await this.saveSharesData(minerEthAddress,sharesData)
   } 


   async saveSharesData(minerEthAddress, sharesData)
   {

     if(minerEthAddress == null) return;

     minerEthAddress = minerEthAddress.toString().toLowerCase()


     await this.mongoInterface.upsertOne("shares_data_downcase",{minerEthAddress: minerEthAddress},sharesData)

      //only save to redis for frontend
     await this.redisInterface.storeRedisHashData("shares_data_downcase", minerEthAddress , JSON.stringify(sharesData))


   } 

   async getSharesData(minerEthAddress)
   {
     if(minerEthAddress)
     {
       minerEthAddress = minerEthAddress.toString().toLowerCase()


       var sharesDataJSON = await this.mongoInterface.findOne("shares_data_downcase", {minerEthAddress: minerEthAddress} );

       if(sharesDataJSON)
       {
          return  sharesDataJSON  ;
       }

       //broken
          var defaultShareDataJSON = this.getDefaultSharesData(minerEthAddress)
        return   defaultShareDataJSON   ;
     }

      return null;

   }  


   async saveMinerDataToRedisMongo(minerEthAddress, minerData)
   {

     if(minerEthAddress == null) return;

     minerEthAddress = minerEthAddress.toString().toLowerCase()

     await this.redisInterface.storeRedisHashData("miner_data_downcase", minerEthAddress , JSON.stringify(minerData))

     await this.mongoInterface.upsertOne("miner_data_downcase",{minerEthAddress: minerEthAddress},minerData)

   } 


   //REDUNDANT -- DEPRECATED
  /* async loadMinerDataFromMongo(minerEthAddress)
   {
     if(minerEthAddress == null) return null;

      //var existingMinerDataJSON = await this.redisInterface.findHashInRedis("miner_data_downcase", minerEthAddress.toString().toLowerCase() );

      var existingMinerDataJSON = await this.mongoInterface.findOne("miner_data_downcase", {minerEthAddress: minerEthAddress.toString().toLowerCase()} );


     if(existingMinerDataJSON == null)
     {
       existingMinerData = this.getDefaultMinerData(minerEthAddress);
     }else{
       existingMinerData = JSON.parse(existingMinerDataJSON)
       existingMinerData.minerEthAddress = minerEthAddress.toString().toLowerCase()
     }

     return existingMinerData;
   } */

  










  async initJSONRPCServer()
     {
       let mongoInterface = this.mongoInterface 
       let poolConfig = this.poolConfig 
       ///var self = this;

       console.log('listening on JSONRPC server localhost:8080')
         // create a server
         var server = jayson.server({
           ping: function(args, callback) {

               callback(null, 'pong');

           },

           getPoolProtocolVersion: function(args, callback) {

                return "1.02";

           },

           getPoolEthAddress: function(args, callback) {

               callback(null, PeerHelper.getMintHelperAddress(poolConfig).toString() );

           },

           getMinimumShareDifficulty: async function(args, callback) {

            var minerEthAddress = args[0];


            var difficulty = await PeerHelper.getPoolMinimumShareDifficulty(poolConfig );
            console.log('sent to miner ', difficulty)

            callback(null, difficulty);


          },

          getMinimumShareTarget: async function(args, callback) {
            var minerEthAddress = args[0];

           //  var varDiff = await PeerHelper.getPoolMinimumShareDifficulty( poolConfig );

            //always described in 'hex' to the cpp miner
            var minTargetBN = PeerHelper.getPoolMinimumShareTarget( poolConfig  );

            //console.log('giving target ', minTargetBN , minTargetBN.toString(16) )
           callback(null,  minTargetBN.toString() );

         },
         getChallengeNumber: async function(args, callback) {

           var challenge_number = await TokenDataHelper.getChallengeNumber( mongoInterface ) 

           if(challenge_number!= null)
           {
             challenge_number = challenge_number.toString()
           }
          callback(null, challenge_number );

        },

        allowingCustomVardiff: async function(args, callback) {

          return (poolConfig.miningConfig.allowCustomVardiff == true);
        },

        submitShare: async function(args, callback) {

          var validJSONSubmit = true;

          var nonce = args[0];
          var minerEthAddress = args[1];
          var digest = args[2];
          var difficulty = args[3];
          var challenge_number = args[4];
          var custom_vardiff_used = args[5];

          if(
            difficulty == null  ||
            nonce == null  ||
            minerEthAddress == null  ||
            challenge_number == null  ||
            digest == null
          ) {
            validJSONSubmit = false;
          }


          if(custom_vardiff_used == null)
          {
            custom_vardiff_used = false;
          }



          var minShareDifficulty = PeerHelper.getPoolMinimumShareDifficulty(poolConfig)  ;
          if( difficulty <  minShareDifficulty)
          {
            validJSONSubmit = false;
          }


          // no vardiff since it is pointless 
         /* var maxShareDifficulty = PeerHelper.getPoolMaximumShareDifficulty(poolConfig)  ;
          if( maxShareDifficulty != null && difficulty >  maxShareDifficulty)
          {
            difficulty = maxShareDifficulty;
          }*/

          var poolEthAddress = self.getMintHelperAddress() ;
          var poolChallengeNumber = await PeerHelper.getPoolChallengeNumber(mongoInterface);
          var computed_digest =  web3utils.soliditySha3( poolChallengeNumber , poolEthAddress, nonce )

          var digestBigNumber = web3utils.toBN(digest);
          var claimedTarget = PeerHelper.getTargetFromDifficulty( difficulty )

          if(computed_digest !== digest || digestBigNumber.gte(claimedTarget))
          {
            validJSONSubmit = false;
          }

          var ethBlock = await self.redisInterface.getEthBlockNumber();

          var shareData = {block: ethBlock ,
            nonce: nonce,
            minerEthAddress: minerEthAddress,
            challengeNumber: challenge_number,
            digest: digest,
            difficulty: difficulty,
            customVardiff: custom_vardiff_used

          };

          //var response = await self.redisInterface.pushToRedisList("queued_shares_list", JSON.stringify(shareData));
          var response = await mongoInterface.insertOne('queued_shares_list', shareData )

          callback(null,  validJSONSubmit );

          },



           getMinerData: async function(args, callback) {

             var minerEthAddress = args[0];
             var minerData = null;

             if(web3utils.isAddress(minerEthAddress.toString()) ){
                 minerData = await self.getMinerData(minerEthAddress);
             }else{
               console.log('getMinerData error: not a valid address')
             }


             /*if(minerData.varDiff <  minDiff)
             {
               minerData.varDiff  = minDiff;
             }*/

             // console.log('meep',minerData)
            callback(null, JSON.stringify( minerData )  );

          },
          getAllMinerData: async function(args, callback) {

            var minerData = await PeerHelper.getAllMinerData(mongoInterface);


           callback(null, JSON.stringify( minerData )  );

         },

         });

         server.http().listen(8080);

     } 



      


     

       
}
