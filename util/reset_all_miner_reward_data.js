
var redisInterface = require('../lib/redis-interface')
var mongoInterface = require('../lib/mongo-interface')



init();


async function init()
{
  var redis = await redisInterface.init()
  var mongo = await mongoInterface.init()



  var minerList = await getMinerList( );

   
  for(var i in minerList)
  {
    var minerAddress = minerList[i]



    minerAddress = minerAddress.toString().toLowerCase()

    var minerData = await getMinerData( minerAddress )

    if(minerData)
    {
      console.log('operating on ', minerAddress)
      minerData.alltimeTokenBalance = 0;
      minerData.tokensAwarded = 0;
      minerData.tokenBalance = 0;
    }else{
      console.log('data not found', minerAddress)
    }


    await saveMinerData( minerAddress, minerData)

  }


   console.log('done!' )
}


async function getMinerList(   )
{
    var minerDataArray = await mongoInterface.findAll("miner_data_downcase" );

    var minerAddressArray = minerDataArray.map(item => item.minerEthAddress)

    return minerAddressArray;

}

async function getMinerData( minerEthAddress)
{
  if(minerEthAddress)
  {
    var minerData  = await mongoInterface.findOne("miner_data_downcase", {minerEthAddress: minerEthAddress.toString().toLowerCase() } );



     return  minerData;
  }

   return null;

}

async function saveMinerData( minerEthAddress, minerData)
{

  if(minerEthAddress == null) return;

  minerEthAddress = minerEthAddress.toString().toLowerCase()


  await mongoInterface.upsertOne("miner_data_downcase",{minerEthAddress: minerEthAddress},minerData)

}
