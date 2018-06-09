
/*


  Save certain stats to redis every hour


*/

var STAT_COLLECTION_PERIOD = 60*60*1000;

module.exports =  {



    async init( redisInterface,webInterface,peerInterface )
    {


      this.redisInterface = redisInterface;
      this.peerInterface=peerInterface;
      var self = this;

    //  var dropResponse =  await this.redisInterface.dropList('total_pool_hashrate')
    //  console.log('dropResponse',dropResponse)
      setInterval( async function(){
        await self.collectStats();
      },STAT_COLLECTION_PERIOD);

      setTimeout( async function(){
        await self.collectStats();
      },5*1000);


    },


    //this is probably buggy 
    async collectStats()
    {

       console.log("COLLECT STATS")
        var totalHashrateData = await this.getTotalMinerHashrate();

        var blockNum = await this.redisInterface.getEthBlockNumber()

        //pushed to a list !
        var stored = await this.redisInterface.pushToRedisList('total_pool_hashrate', JSON.stringify({block: blockNum, hashrate: totalHashrateData.hashrate}))

        //this.redisInterface.storeRedisData('totalPoolHashrate', totalHashrateData.hashrate )
        //this.redisInterface.storeRedisData('activeMinersCount', totalHashrateData.activeMinersCount )

        /*
        const ETH_BLOCKS_PER_HOUR = 4*60;

        var blockInLastHour = 0;
        var mintTransactionList =  await this.redisInterface.getRecentElementsOfListInRedis('submitted_solutions_list',limitAmount)

        for(var i in mintList) //reward each miner
        {
          console.log('mintList',mintList)


        }

        */



           console.log("stored",stored)
    },

    async getTotalMinerHashrate()
    {
      var allMinerData = await this.peerInterface.getAllMinerData();


      var hashrateSum = 0;
      var activeMinersCount = 0;

      for(i in allMinerData)
      {
        var data = allMinerData[i].minerData

        var minerAddress = data.minerAddress;
        var minerHashrate = parseInt( data.hashRate );

         if(isNaN(minerHashrate)){
           minerHashrate = 0;
           continue
         }

        hashrateSum += minerHashrate;
        activeMinersCount++;

      }

      return {
        hashrate: minerHashrate,
        poolTotalHashrate: hashrateSum,
        activeMinersCount:  activeMinersCount
      }

    }





}
