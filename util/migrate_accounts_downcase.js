
var redisInterface = require('../lib/redis-interface')



init();


async function init()
{
   await redisInterface.init()



   var miner_keys = await redisInterface.getResultsOfKeyInRedis('miner_data')

   for(i in miner_keys)
   {
     var minerAddress = miner_keys[i];
     var minerDataJSON = await redisInterface.findHashInRedis('miner_data',minerAddress);
     var minerData = JSON.parse(minerDataJSON)

     var minerAddressDowncase = minerAddress.toString().toLowerCase();
     var result = await redisInterface.storeRedisHashData('miner_data_downcase',minerAddressDowncase,JSON.stringify(minerData));

      console.log('fix success', minerAddressDowncase)
   }

   console.log('done!' )
}
