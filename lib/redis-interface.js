
 var redis = require("redis");

   var redisClient;


module.exports =  {



    async init(  accountConfig, poolConfig , tokenInterface ,pool_env)
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

     getRedisClient()
     {
       return redisClient;
     },

     async getEthBlockNumber()
     {
       var result = parseInt( await this.loadRedisData('ethBlockNumber' ));

       if(isNaN(result) || result < 1) result = 0 ;

       return result
     },



     async setKeyExpiration(key,ttl )
     {
       return   redisClient.expire(key,ttl);
     },

     //these make annoying console prints
     async storeRedisData(key, data )
     {
       return   redisClient.set(key, JSON.stringify(data) );
     },

     //these make annoying console prints
     async loadRedisData(key )
     {

       return new Promise(function (fulfilled,rejected) {

         redisClient.get(key, function (err, reply) {
            if(err){rejected(err);return;}

            var response = JSON.parse(reply)
            fulfilled(response);

          });
        });


     },

      async storeRedisHashData(key, hash, data )
      {
        return   redisClient.hset(key, hash, data );
      },

      async pushToRedisList(key, data )
      {
        return   redisClient.lpush(key, data );
      },

      //view the top one
      async peekFirstFromRedisList(key )
      {
        return new Promise(function (fulfilled,rejected) {

          redisClient.lindex(key, 0, function (err, reply) {
             if(err){rejected(err);return;}

             fulfilled(reply);

           });
         });

      },

      async peekLastFromRedisList(key )
      {
        return new Promise(function (fulfilled,rejected) {

          redisClient.lindex(key, -1, function (err, reply) {
             if(err){rejected(err);return;}

             fulfilled(reply);

           });
         });

      },


      //get the last element of the array ! (most recent)

      //remove me
      async popFromRedisList(key )
      {
        return new Promise(function (fulfilled,rejected) {

          redisClient.lpop(key, function (err, reply) {
             if(err){rejected(err);return;}

             fulfilled(reply);

           });
         });

      },

      async popFirstFromRedisList(key )
      {
        return new Promise(function (fulfilled,rejected) {

          redisClient.lpop(key, function (err, reply) {
             if(err){rejected(err);return;}

             fulfilled(reply);

           });
         });

      },

      async popLastFromRedisList(key )
      {
        return new Promise(function (fulfilled,rejected) {

          redisClient.rpop(key, function (err, reply) {
             if(err){rejected(err);return;}

             fulfilled(reply);

           });
         });

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

        async deleteHashInRedis( key, hash )
        {
          return new Promise(function (fulfilled,rejected) {

            redisClient.hdel(key,hash, function (err, reply) {
               if(err){rejected(err);return;}

               fulfilled(reply);

             });
           });
        },


        async deleteHashArrayInRedis( key,  )
        {
          return new Promise(function (fulfilled,rejected) {

            redisClient.del(key, function (err, reply) {
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

              //  console.log('redis keys:')
                 replies.forEach(function (item, i) {
                  //   console.log("    " + i + ": " + item);
                     array.push( item )
                 });

              //    console.log('found from redis ', JSON.stringify(array ) )
                 fulfilled(array);
                 //redisClient.quit();
             });



           });

           return results;
        },

        /*async getResultsOfKeyInRedis(key)
          {
            return new Promise(function (fulfilled,rejected) {

               redisClient.hgetall(key, function (err, reply) {
                 if(err){rejected(err);return;}
                 console.log("MEEP", reply)
                 fulfilled(reply);
               });

             });
          },*/

        async getElementsOfListInRedis(key)
        {
          var results = await new Promise(function (fulfilled,rejected) {

             var array = [];

             //get first to last element
             redisClient.lrange(key, 0, -1, function (err, replies) {
                if(err){rejected(err);return;}

              //  console.log('redis keys:')
                 replies.forEach(function (item, i) {
                  //   console.log("    " + i + ": " + item);
                     array.push( item )
                 });

              //    console.log('found from redis ', JSON.stringify(array ) )
                 fulfilled(array);
                 //redisClient.quit();
             });

           });

           return results;
        },

        async isElementInRedisList(key, element)
        {
          var result = await new Promise(function (fulfilled,rejected) {

             //get all elements in the list
             redisClient.lrange(key, 0, -1, function (err, replies) {
                if(err){rejected(err);return;}

                 replies.forEach(function (item, i) {
                    if (item == element) {
                      fulfilled(true);
                    }
                 });

                 fulfilled(false);
             });
           });

           return result;
        },

        async removeFromRedisListToLimit(key, maxLimit )
        {
          var results = await new Promise(function (fulfilled,rejected) {

             var array = [];

             //get first to last element
             redisClient.ltrim(key, 0, maxLimit, function (err, reply) {
                if(err){rejected(err); }


                 fulfilled(reply);
             });

           });
           return results;
        },

        //WARNING WARNING - DELETES A LIST
        async dropList(key)
        {
          var results = await new Promise(function (fulfilled,rejected) {

             var array = [];

             //get first to last element
             redisClient.ltrim(key, 1, 0, function (err, reply) {
                if(err){rejected(err); }


                 fulfilled(reply);
             });

           });
           return results;
        },


        //Does not use the limit !!!
        async getParsedElementsOfListInRedis(key)
        {
          var results = await new Promise(function (fulfilled,rejected) {

             var array = [];

             //get first to last element
             redisClient.lrange(key, 0, -1, function (err, replies) {
                if(err){rejected(err);return;}

                 replies.forEach(function (item, i) {
                     array.push( JSON.parse(item) )
                 });

                 fulfilled(array);
             });

           });

           return results;
        },

        async getRecentElementsOfListInRedis(key, amount)
        {
          var results = await new Promise(function (fulfilled,rejected) {

             var array = [];

             //get first to last element
             redisClient.lrange(key, 0, (1 * amount), function (err, replies) {
                if(err){rejected(err);return;}

              //  console.log('redis keys:')
                 replies.forEach(function (item, i) {
                  //   console.log("    " + i + ": " + item);
                     array.push( JSON.parse(item) )
                 });

              //    console.log('found from redis ', JSON.stringify(array ) )
                 fulfilled(array);
                 //redisClient.quit();
             });



           });

           return results;
        },



}
