


var redisInterface = require('../lib/redis-interface')


init();


async function init()
{


   var minerAddress = process.argv[2]

   console.log('minerAddress',minerAddress)

   var redis = await redisInterface.init()


   //set miners pending balance to 0

   var minerData = await getMinerData(minerAddress)

   if(minerData ==null)
   {
     console.log('no miner data exists!', minerAddress  )
     return;
   }else {
      console.log('original miner data:', minerAddress, minerData )
   }

   minerData.tokenBalance = 0;

   await saveMinerDataToRedis(minerAddress,minerData)


  // var balance_xfers = await redisInterface.deleteHashArrayInRedis('balance_payment')

   console.log('saved new iner data:', minerAddress, minerData )
   return;
}


async function getMinerData(minerEthAddress)
{

  var minerDataJSON = await  redisInterface.findHashInRedis("miner_data", minerEthAddress );

  if(minerDataJSON==null)
  {
      return null;
  }

  return JSON.parse(minerDataJSON) ;

}

async function saveMinerDataToRedis(minerEthAddress, minerData)
{
  await this.redisInterface.storeRedisHashData("miner_data", minerEthAddress , JSON.stringify(minerData))

}
