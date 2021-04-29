
 //var redis = require("redis");
   import jayson from 'jayson' 

   import web3utils from 'web3-utils' 

   //var peerUtils = require('./peer-utils')

   import LoggingHelper from './util/logging-helper.js'

  import PeerHelper from './util/peer-helper.js'
  import TokenDataHelper from './util/token-data-helper.js';
  import TransactionHelper from './util/transaction-helper.js';

  import TokenInterface from './token-interface.js'
  import PoolStatsHelper from './util/pool-stats-helper.js';

  import Web3 from 'web3' 
 
  import ContractHelper from './util/contract-helper.js' 

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
    this.tokenContract = ContractHelper.getTokenContract(this.web3, this.poolConfig  )  


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


 



  async listenForJSONRPC()
  {

        this.initJSONRPCServer();

  } 

  async update()
  {

    this.processQueuedShares(this.mongoInterface, this.poolConfig)

 

    // setInterval(function(){this.processQueuedShares(this.mongoInterface, this.poolConfig)}.bind(this),200)

     

    //Error


    setInterval(function(){PeerHelper.calculateMinerHashrateData(this.mongoInterface, this.poolConfig)}.bind(this), 4000)
    setInterval(function(){PeerHelper.cleanOldData(this.mongoInterface, this.poolConfig)}.bind(this), 30* 1000)

  } 


    //refactor 
    //write a test !! 
  async processQueuedShares(mongoInterface, poolConfig)
  {
   

    let shareDataResult  = await mongoInterface.findAndDeleteOne('queued_shares_list', {} )  //this.redisInterface.popFromRedisList("queued_shares_list")

    let shareData = shareDataResult.value 

   
    //var shareData = JSON.parse(shareDataJSON)

    //console.log('process queued shares')

    if(typeof shareData != 'undefined' && shareData != null)
    {

      LoggingHelper.appendLog('share data to process', LoggingHelper.TYPECODES.GENERIC, mongoInterface)

     
      
      try{
        var response =  await PeerInterface.handlePeerShareSubmit(shareData, mongoInterface , poolConfig);
        }catch(err)
        {
          LoggingHelper.appendLog(['handle share error',err], LoggingHelper.TYPECODES.ERROR, mongoInterface)

          
        }
      }else {
       // console.log('WARNING: share data undefined')
      }
    
    
    //keep looping 
      setTimeout(function(){this.processQueuedShares(mongoInterface,poolConfig)}.bind(this),0)

  } 


 


/* 




   /*
    This is the gatekeeper for solution submits
   */

   
   static async handlePeerShareSubmit(shareData ,mongoInterface, poolConfig)
   {
    //nonce,minerEthAddress,challengeNumber,digest,difficulty
    let nonce = shareData.nonce 
    let minerEthAddress = shareData.minerEthAddress 
    let challengeNumber = shareData.challengeNumber 
    let digest = shareData.digest 
    let difficulty = shareData.difficulty 

    
   
 
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


     var poolEthAddress = PeerHelper.getPoolEthAddress(poolConfig);

     let poolChallengeNumber = await TokenDataHelper.getChallengeNumber(mongoInterface)
  

     
     var computed_digest =  web3utils.soliditySha3( poolChallengeNumber , poolEthAddress, nonce )
     

     LoggingHelper.appendLog( ['got new share from miner ', minerEthAddress, ' ', poolChallengeNumber , poolEthAddress, nonce, computed_digest], LoggingHelper.TYPECODES.SHARES, mongoInterface)



     var digestBytes32 = web3utils.hexToBytes(computed_digest)
     var digestBigNumber = web3utils.toBN(computed_digest)


     let poolMinDiff =  PeerHelper.getPoolMinimumShareDifficulty( poolConfig )
      
     


     var minShareTarget = web3utils.toBN(PeerHelper.getPoolMinimumShareTarget(poolConfig) ) ;
     var miningTarget = web3utils.toBN(await TokenDataHelper.getPoolDifficultyTarget(mongoInterface) ) ;

     var claimedTarget = PeerHelper.getTargetFromDifficulty( difficulty )



     //var varDiff = await this.getMinerVarDiff(minerEthAddress);
     //let varDiff = await PeerHelper.getPoolMinimumShareDifficulty(mongoInterface)



     /*
      SHOULD BE USING THE PARAMETER customVardiff  BUT WILL WAIT FOR MINERS TO IMPLEMENT
     */
    // var usingCustomDifficulty = (difficulty != varDiff);

 


    var minShareDifficulty = PeerHelper.getPoolMinimumShareDifficulty( poolConfig )   




    if(computed_digest === digest &&
       difficulty >= minShareDifficulty &&
       digestBigNumber.lt(minShareTarget)  ){

        var shareIsASolution = digestBigNumber.lt(miningTarget)

        return await this.handleValidShare( nonce,
                                            minerEthAddress,
                                            digest,
                                            difficulty,
                                            shareIsASolution, mongoInterface, poolConfig );

     }else{
       if(computed_digest !== digest) console.log(' bad digest ', computed_digest, digest)
       if(difficulty < minShareDifficulty) console.log(' bad diff ', difficulty, minShareDifficulty)
       if( digestBigNumber.lt(minShareTarget) == false) console.log(' not less than target  ', digestBigNumber.toString(), minShareTarget.toString(), poolMinDiff.toString())


       var ethBlock = await TokenDataHelper.getEthBlockNumber(mongoInterface)

       var shareData =  {
         block: ethBlock,
         nonce: nonce,
         minerEthAddress: minerEthAddress,
         difficulty: difficulty,
         digest: digest,
         isSolution: false,   //invalid share 
         time: PeerHelper.getTimeNowSeconds()
        };

       //await this.redisInterface.storeRedisHashData("invalid_share", digest , JSON.stringify(shareData))
        
        await mongoInterface.insertOne("miner_shares", shareData )
      // await this.redisInterface.pushToRedisList("miner_invalid_share:"+minerEthAddress.toString().toLowerCase(),  JSON.stringify(shareData))
           //await mongoInterface.  //IMPLEMENT ME 


       return {success: false, message: "This share digest is invalid"};

     }

   } 



  static async  handleValidShare( nonce,minerEthAddress,digest,difficulty, shareIsASolution, mongoInterface, poolConfig )
   {
      
      var existingShare =  await  mongoInterface.findOne('miner_shares', {digest: digest}  ) //await this.redisInterface.findHashInRedis("submitted_share", digest );

        //make sure we have never gotten this digest before (redis )
      if(existingShare == null && minerEthAddress!=null)
      { 

        LoggingHelper.appendLog(['handle valid new share from', minerEthAddress], LoggingHelper.TYPECODES.GENERIC, mongoInterface)


        var ethBlock = await TokenDataHelper.getEthBlockNumber(mongoInterface)


        var minerData = await PeerHelper.getMinerData(minerEthAddress.toString().toLowerCase(), mongoInterface)

        // minerData.usingCustomDifficulty = usingCustomDifficulty;

       //  await PeerHelper.saveMinerDataToRedisMongo(minerEthAddress,minerData, mongoInterface)

        if(minerData.lastSubmittedSolutionTime != null)
        {
            var timeToFindShare = (PeerHelper.getTimeNowSeconds() - minerData.lastSubmittedSolutionTime);
        }else{
           //make sure we check for this later
            var timeToFindShare = 0;
        }

        var difficultyBN = web3utils.toBN(difficulty);

        var shareData=  {
          block: ethBlock,
          nonce: nonce,
          minerEthAddress: minerEthAddress.toString().toLowerCase(),
          difficulty: difficulty,
          digest:digest,
          isSolution: shareIsASolution,
          hashrateEstimate: PeerHelper.getEstimatedShareHashrate(difficultyBN,timeToFindShare),
          time: PeerHelper.getTimeNowSeconds(),
          timeToFind: timeToFindShare  //helps estimate hashrate- look at recent shares
        };

        //make sure this is threadsafe

        await mongoInterface.insertOne("miner_shares", shareData )

      
        await mongoInterface.updateOne('minerData', {_id: minerData._id},  {lastSubmittedSolutionTime: PeerHelper.getTimeNowSeconds()}    )


          //--optional 
        var shareCredits =  await PeerHelper.getShareCreditsFromDifficulty( difficulty,shareIsASolution,poolConfig )
 
         await PeerHelper.awardShareCredits( minerEthAddress, shareCredits, mongoInterface )
          // -- 

        await PeerHelper.awardTokensBalanceForShares( minerEthAddress, difficulty, poolConfig, mongoInterface )


         
        var challengeNumber = await TokenDataHelper.getChallengeNumber( mongoInterface );

        if( shareIsASolution )
        {
          LoggingHelper.appendLog(['share is a solution!', nonce,minerEthAddress,digest,challengeNumber], LoggingHelper.TYPECODES.SHARES, mongoInterface)
 
          await TokenInterface.queueMiningSolution( nonce,minerEthAddress,digest,challengeNumber, mongoInterface, poolConfig );
        }else{
            // nothing 
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




 






/*
This is the interface that miners connect to ! 
*/


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

                return PoolStatsHelper.getPoolProtocolVersion();

           },


           getPoolStatus: async function(args, callback) {
            let poolSuspended = await PoolStatsHelper.poolMintingIsSuspended(poolConfig,mongoInterface)
          
            return {
              'poolIsSuspended': poolSuspended
            };

           },


           getPoolEthAddress: function(args, callback) {

               callback(null, PeerHelper.getPoolEthAddress(poolConfig).toString() );

           },

           getMinimumShareDifficulty: async function(args, callback) {

            var minerEthAddress = args[0];


            var difficulty = await PeerHelper.getPoolMinimumShareDifficulty(poolConfig );
             
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

           let poolSuspended = await PoolStatsHelper.poolMintingIsSuspended(poolConfig,mongoInterface)

           if(poolSuspended){
             //do not response at all, telling miner we are suspended  
            return
           }

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

          let poolSuspended = await PoolStatsHelper.poolMintingIsSuspended(poolConfig,mongoInterface)
          


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

          var poolEthAddress = PeerHelper.getPoolEthAddress(poolConfig) ;
          var poolChallengeNumber = await TokenDataHelper.getChallengeNumber(mongoInterface);
          var computed_digest =  web3utils.soliditySha3( poolChallengeNumber , poolEthAddress, nonce )

          var digestBigNumber = web3utils.toBN(digest);
          var claimedTarget = PeerHelper.getTargetFromDifficulty( difficulty )

          if(computed_digest !== digest || digestBigNumber.gte(claimedTarget))
          {
            validJSONSubmit = false;
          }

          var ethBlock = await TokenDataHelper.getEthBlockNumber(mongoInterface);

          var shareData = {block: ethBlock ,
            nonce: nonce,
            minerEthAddress: minerEthAddress,
            challengeNumber: challenge_number,
            digest: digest,
            difficulty: difficulty,
            customVardiff: custom_vardiff_used

          };

          LoggingHelper.appendLog( [ 'adding share to queued shares list', computed_digest, digest], LoggingHelper.TYPECODES.SHARES, mongoInterface)
 

          //var response = await self.redisInterface.pushToRedisList("queued_shares_list", JSON.stringify(shareData));
        
          
          if(!poolSuspended){
            var response = await mongoInterface.insertOne('queued_shares_list', shareData )
            
            
            
          }else{
            console.log('WARN: Miner share trashed because pool is suspended')
          
            //do not response at all, telling miner we are suspended  
            return
          }



          //this object can be for apiV2 
          /*let returnData = {
            shareWasValid:  validJSONSubmit,
            poolIsAcceptingShares: !poolSuspended
          }*/

          callback(null,  validJSONSubmit );

          },



           getMinerData: async function(args, callback) {

             var minerEthAddress = args[0];
             var minerData = null;

             if(web3utils.isAddress(minerEthAddress.toString()) ){
                 minerData = await PeerHelper.getMinerData(minerEthAddres, mongoInterface);
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
