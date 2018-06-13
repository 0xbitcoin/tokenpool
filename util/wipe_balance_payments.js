


var redisInterface = require('../lib/redis-interface')



init();

//DEPRECATED
async function init()
{
   await redisInterface.init()


   //var balance_xfers = await redisInterface.deleteHashArrayInRedis('balance_payment')

   console.log('deprecated method..' )
}
