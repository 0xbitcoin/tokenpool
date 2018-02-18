
 var redis = require("redis");
   var jayson = require('jayson');

   var web3utils =  require('web3-utils');

   var redisClient;


module.exports =  {


  async init(  accountConfig, poolConfig , tokenInterface )
  {
    this.accountConfig =accountConfig;
    this.poolConfig=poolConfig;
    this.tokenInterface=tokenInterface;
    this.initRedisStorage();
    this.initJSONRPCServer();

  },

  async initRedisStorage()
   {

      redisClient = redis.createClient();

     // if you'd like to select database 3, instead of 0 (default), call
     // client.select(3, function() { /* ... */ });

     redisClient.on("error", function (err) {
         console.log("Error " + err);
     });

  /*   redisClient.set("string key", "string val", redis.print);
     redisClient.hset("hash key", "hashtest 1", "some value", redis.print);
     redisClient.hset(["hash key", "hashtest 2", "some other value"], redis.print);
     redisClient.hkeys("hash key", function (err, replies) {
         console.log(replies.length + " replies:");
         replies.forEach(function (reply, i) {
             console.log("    " + i + ": " + reply);
         });
         //redisClient.quit();
     });*/

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

    // var max_target = web3utils.toBN( 2 ).pow( web3utils.toBN( 234 ) ) ;
     var max_target = web3utils.toBN( 2 ).pow( web3utils.toBN( 240 ) ) ;


     var current_target = max_target.div( web3utils.toBN( difficulty) );

     return current_target ;
   },


   /*
    This is the gatekeeper for solution submits
   */
   handlePeerShareSubmit(nonce,minerEthAddress,digest,difficulty)
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


     //return {success: true};
   },




   async findHashInRedis( key, hash )
   {
     return new Promise(function (fulfilled,rejected) {

       redisClient.hget(key,hash, function (err, reply) {
          if(err){rejected(err);return;}

          fulfilled(reply);

        });
      });
   },

   async  handleValidShare( nonce,minerEthAddress,digest,difficulty, shareIsASolution )
   {
      console.log('handle valid share ')
      var existingShare = await this.findHashInRedis("submitted_share", digest );

        //make sure we have never gotten this digest before (redis )
      if(existingShare == null)
      {
        console.log('handle valid new share ')

        var shareData=  {nonce: nonce, miner: minerEthAddress, difficulty: difficulty, isSolution: shareIsASolution};

        //make sure this is threadsafe
        redisClient.hset("submitted_share", digest , JSON.stringify(shareData), redis.print);

        var shareCredits =  this.getShareCreditsFromDifficulty( difficulty )

        this.awardShareCredits( minerEthAddress, shareCredits )

        var challengeNumber = this.tokenInterface.getPoolChallengeNumber();

        if( shareIsASolution )
        {
          this.tokenInterface.queueMiningSolution( nonce,minerEthAddress,digest,challengeNumber )
        }else {
          this.tokenInterface.queueMiningSolution( nonce,minerEthAddress,digest,challengeNumber )

        }

        return {success: true, message: "New share credited successfully"}

      }else{
        return {success: false, message: "This share digest was already received"}
      }

   },


    getShareCreditsFromDifficulty(difficulty)
   {

     var minShareDifficulty = this.getPoolMinimumShareDifficulty()  ;
     var miningDifficulty = this.tokenInterface.getPoolDifficulty()  ;

     if(difficulty >= miningDifficulty)
     {
       //if submitted a solution
       return 1000;
     }else if(difficulty >= minShareDifficulty)
     {
       return Math.ceil( (minShareDifficulty /  miningDifficulty ) * 1000 ) ;
     }


   },


   async awardShareCredits( minerEthAddress, shareCredits )
   {
     var existingMinerDataJSON = await this.findHashInRedis("miner_data", minerEthAddress );

     if(existingMinerDataJSON == null)
     {
       existingMinerData = this.getDefaultMinerData();
     }else{
       existingMinerData = JSON.parse(existingMinerDataJSON)
     }


     existingMinerData.shareCredits += parseInt(shareCredits);

     console.log( 'miner data ', minerEthAddress, JSON.stringify(existingMinerData))

     redisClient.hset("miner_data", minerEthAddress , JSON.stringify(existingMinerData), redis.print);

   },

   getDefaultMinerData(){
     return {
       shareCredits: 0
     }
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
            callback(null, self.handlePeerShareSubmit(nonce,minerEthAddress,digest,difficulty));

           },

         });

         server.http().listen(8586);

     }




}
