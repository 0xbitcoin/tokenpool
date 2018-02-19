
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

    this.initJSONRPCServer();

    setInterval( this.monitorMinedSolutions()  , 10*1000 )

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
          this.tokenInterface.queueMiningSolution( nonce,minerEthAddress,digest,challengeNumber );
        }

        return {success: true, message: "New share credited successfully"}

      }else{
        return {success: false, message: "This share digest was already received"}
      }

   },



   async monitorMinedSolutions()
   {
     var solution_txes = this.redisInterface.getResultsOfKeyInRedis('submitted_solution_tx')

     console.log('solution_txes',solution_txes)


   }



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

      loadMinerDataToRedis(minerEthAddress,minerData)
   },

   async loadMinerDataToRedis(minerEthAddress, minerData)
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
