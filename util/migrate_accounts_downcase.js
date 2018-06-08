

// npm run migrate_accounts_downcase

var redisInterface = require('../lib/redis-interface')



init();


async function init()
{
   await redisInterface.init()


   //wipe downcase data
   var downcase_miner_keys = await redisInterface.getResultsOfKeyInRedis('miner_data_downcase')

   for(var i in downcase_miner_keys)
   {
     var minerAddress = downcase_miner_keys[i];
     console.log('deleting data ',minerAddress)
     redisInterface.deleteHashInRedis('miner_data_downcase',minerAddress)

   }



   //move over the miner data and sum it

   var miner_keys = await redisInterface.getResultsOfKeyInRedis('miner_data')

   for(var i in miner_keys)
   {
     var minerAddress = miner_keys[i];
     var minerDataJSON = await redisInterface.findHashInRedis('miner_data',minerAddress);
     var minerData = JSON.parse(minerDataJSON)


     var minerAddressDowncase = minerAddress.toString().toLowerCase();
     var existingNewMinerDataJSON = await redisInterface.findHashInRedis('miner_data_downcase',minerAddressDowncase);
     if(minerDataJSON )
     {
       var existingNewMinerData = JSON.parse(minerDataJSON)
       minerData.tokenBalance += existingNewMinerData.tokenBalance;
       console.log('summing token balance', minerAddressDowncase , minerData.tokenBalance)
     }



     var result = await redisInterface.storeRedisHashData('miner_data_downcase',minerAddressDowncase,JSON.stringify(minerData));

      console.log('fix success', minerAddressDowncase)
   }

   console.log('done!' )
}
