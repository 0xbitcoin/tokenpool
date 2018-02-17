
 var redis = require("redis");
   var jayson = require('jayson');

module.exports =  {


  async init( )
  {
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

  async initJSONRPCServer()
     {



       console.log('listening on JSONRPC server localhost:4040')
         // create a server
         var server = jayson.server({
           getShareDifficulty: function(args, callback) {

             if(punkOwnersCollected == false )
             {
               callback(null, 'notSynced');
             }


             var punk_id = args[0];
             var punk_owner_address = punkOwners[punk_id];
             callback(null, punk_owner_address);


           }
         });

         server.http().listen(8586);

     }




}
