


var redisInterface = require('../lib/redis-interface')



init();


async function init()
{
   await redisInterface.init()


   var balance_xfers = await redisInterface.deleteHashArrayInRedis('balance_payment')

   console.log('done!' )
}
