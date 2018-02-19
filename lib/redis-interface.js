
 var redis = require("redis");

   var redisClient;


module.exports =  {



    async init(  accountConfig, poolConfig , tokenInterface ,test_mode)
    {

      this.initRedisStorage();

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

      async storeRedisHashData(key, hash, data )
      {
        redisClient.hset(key, hash, data, redis.print);
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

        async getResultsOfKeyInRedis(key)
        {
          var results = await new Promise(function (fulfilled,rejected) {

             var array = [];

             redisClient.hkeys(key, function (err, replies) {
                if(err){rejected(err);return;}

                console.log('redis keys:')
                 replies.forEach(function (item, i) {
                     console.log("    " + i + ": " + item);
                     array.push( item )
                 });

                  console.log('found from redis ', JSON.stringify(array ) )
                 fulfilled(array);
                 //redisClient.quit();
             });



           });

           return results;
        },



}
