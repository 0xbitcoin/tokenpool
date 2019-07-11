


var redisInterface = require('../lib/redis-interface')

var mongoInterface = require('../lib/mongo-interface')


init();


async function init()
{


   var minerAddress = process.argv[2]

   console.log('minerAddress',minerAddress)

   var redis = await redisInterface.init()
   var mongo = await mongoInterface.init()


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

   await saveMinerDataToRedisMongo(minerAddress,minerData)


  // var balance_xfers = await redisInterface.deleteHashArrayInRedis('balance_payment')

   console.log('saved new miner data:', minerAddress, minerData )
   return;
}


async function getMinerData(minerEthAddress)
{

  var minerDataJSON = await  mongoInterface.findOne("miner_data_downcase", {minerEthAddress: minerEthAddress } );

  if(minerDataJSON==null)
  {
      return null;
  }

  return JSON.parse(minerDataJSON) ;

}

async function saveMinerDataToRedisMongo(minerEthAddress, minerData)
{

  if(minerEthAddress == null) return;

  minerEthAddress = minerEthAddress.toString().toLowerCase()

  await redisInterface.storeRedisHashData("miner_data_downcase", minerEthAddress , JSON.stringify(minerData))

  await mongoInterface.upsertOne("miner_data_downcase",{minerEthAddress: minerEthAddress},minerData)

}
