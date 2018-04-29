
var redisInterface = require('../lib/redis-interface')



init();


async function init()
{
   await redisInterface.init()



   var transfer_keys = await redisInterface.getResultsOfKeyInRedis('balance_transfer')

   for(i in transfer_keys)
   {
     var transferId = transfer_keys[i];
     var transferDataJSON = await redisInterface.findHashInRedis('balance_transfer',transferId);
     var transferData = JSON.parse(transferDataJSON)

     var minerAddress = transferData.addressTo;
     var result = await redisInterface.storeRedisHashData('balance_transfer:'+minerAddress.toString(),transferId,transferDataJSON);

      console.log('fix success', minerAddress.toString())
   }

   console.log('done!' )
}
