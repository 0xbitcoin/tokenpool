


var redisInterface = require('../lib/redis-interface')

var mongoInterface = require('../lib/mongo-interface')


init();


async function init()
{


   var paymentId = process.argv[2]

   console.log('paymentId',paymentId)

   var redis = await redisInterface.init()
   var mongo = await mongoInterface.init()

   var balanceTransferJSON = await redisInterface.findHashInRedis('balance_transfer',paymentId);
   var transferData = JSON.parse(balanceTransferJSON)



   //set miners pending balance to 0


   if(transferData ==null)
   {
     console.log('no transferData exists!', paymentId  )
     return;
   }else {
      console.log('original transferData:', paymentId, transferData )
   }

   transferData.confirmed = true;
   transferData.succeeded = true;


   await redisInterface.storeRedisHashData('balance_transfer' ,paymentId,JSON.stringify(transferData) )

   await redisInterface.storeRedisHashData('balance_transfer:'+transferData.addressTo.toString().toLowerCase() ,paymentId,JSON.stringify(transferData) )



  // var balance_xfers = await redisInterface.deleteHashArrayInRedis('balance_payment')

   console.log('saved new balance_transfer:', transferData  )
   return;
}
