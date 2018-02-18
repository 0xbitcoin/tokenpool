
 var redis = require("redis");
   var jayson = require('jayson');

module.exports =  {


  async init(  poolConfig , tokenInterface )
  {
    this.poolConfig=poolConfig;
    this.tokenInterface=tokenInterface;
    this.initRedisStorage();
    this.initJSONRPCServer();

  },

  async initRedisStorage()
   {

         var client = redis.createClient();

     // if you'd like to select database 3, instead of 0 (default), call
     // client.select(3, function() { /* ... */ });

     client.on("error", function (err) {
         console.log("Error " + err);
     });

     client.set("string key", "string val", redis.print);
     client.hset("hash key", "hashtest 1", "some value", redis.print);
     client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
     client.hkeys("hash key", function (err, replies) {
         console.log(replies.length + " replies:");
         replies.forEach(function (reply, i) {
             console.log("    " + i + ": " + reply);
         });
         client.quit();
     });
   },

   //implement me !
   getPoolEthAddress()
   {
     return this.poolConfig.poolEthereumAddress;
   },

   getPoolMinimumShareDifficulty()
   {
     return this.poolConfig.minimumShareDifficulty;
   },

   getPoolMinimumShareTarget() //compute me
   {
     return getTargetFromDifficulty(getPoolMinimumShareDifficulty());
   },


   getTargetFromDifficulty(difficulty)
   {
     var max_target = Math.pow(2,234);

     var current_target = max_target / difficulty;

   },


   //implement me !
   handlePeerShareSubmit(nonce,minerEthAddress,digest,difficulty)
   {
     return '';
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

               callback(null, self.getPoolEthAddress());

           },
           getMinimumShareDifficulty: function(args, callback) {

            callback(null, self.getPoolMinimumShareDifficulty());

          },
          getMinimumShareTarget: function(args, callback) {

           callback(null, self.getPoolMinimumShareTarget());

         },
         getChallengeNumber: function(args, callback) {

          callback(null, self.tokenInterface.getPoolChallengeNumber());

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
