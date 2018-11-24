var redisInterface;

const fetch = require('node-fetch');



module.exports =  {

  async init(redis  )
  {

    var self = this

      redisInterface = redis;

      setInterval(function(){ self.collectPunkDataFromAPI() }, 60*1000);

      self.collectPunkDataFromAPI()

  },


    async collectPunkDataFromAPI( )
    {
      //put into redis .. every so often

      var punkDataArray   = await this.getPunkDataFromAPI();
    //  var punkDataArray = JSON.parse(punkDataArrayJSON)


      punkDataArray.forEach(async (element) => {

          await redisInterface.storeRedisHashData('punk_data', element.punkIndex, JSON.stringify(element) )

      });


      //for each known miner, store first punk data
       var activeMiners = await redisInterface.getResultsOfKeyInRedis("miner_data_downcase" );
    //   var activeMiners = JSON.parse(activeMinersJSON)

       for(i in activeMiners)
       {
         var minerAddress = activeMiners[i];

         ///test
         // minerAddress = '0x84cf215f0669737a5845768fa6a3add1766f2c00'

         var punksOfMiner = punkDataArray.filter(i => i.punkOwnerAddress.toLowerCase() == minerAddress.toLowerCase())

     
         await redisInterface.storeRedisHashData('miner_punks',minerAddress.toLowerCase(), JSON.stringify(punksOfMiner));

       }


    },

    async getPunkDataFromAPI( )
    {
      //put into redis .. every so often

      var res =  await fetch('http://api.0xbtc.io/punks', {
        method: 'get',
        header: "Content-Type: application/json"
      });

      return res.json()

    },

  async getFirstPunkDataForAddress(address, redis)
  {

    //get from redis !!  and  thats from a scrape  of api
    var punksOfMinerJSON = await redis.findHashInRedis("miner_punks", address.toLowerCase()  );
    var punksOfMiner = JSON.parse(punksOfMinerJSON)

    if(punksOfMiner && punksOfMiner[0])
    {
      return punksOfMiner[0]
    }

    return null

  },


   getImageUrlForPunkId(punkId)
  {
    if(punkId > 999)
    {
      var punkNumber = punkId.toString()
    }else {
      var punkNumber = this.leftpad(punkId.toString(),3)
    }

    return ('http://api.0xbtc.io/img/punk' + punkNumber + '.png')
  },


    leftpad(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
}


}
