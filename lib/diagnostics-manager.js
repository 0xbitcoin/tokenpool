
/*


  Save certain stats to redis every hour


*/

import PoolStatsHelper from './pool-stats-helper' 

var STAT_COLLECTION_PERIOD = 60*60*1000;

module.exports =  {



    async init( mongoInterface )
    {


      this.mongoInterface = mongoInterface;
     
     // var self = this;

      // this.peerInterface=peerInterface;

    //  var dropResponse =  await this.redisInterface.dropList('total_pool_hashrate')
    //  console.log('dropResponse',dropResponse)
      


    },

    async update(){
      setInterval(this.collectStats.bind(this),STAT_COLLECTION_PERIOD);

      setTimeout(this.collectStats.bind(this),5*1000);
    },

    async collectStats()
    {

       console.log("COLLECT STATS")
        var totalHashrate = await PoolStatsHelper.getTotalMinerHashrate(this.mongoInterface);

        var blockNum = await PoolStatsHelper.getEthBlockNumber(this.mongoInterface)

        //var stored = await this.redisInterface.pushToRedisList('total_pool_hashrate', JSON.stringify({block: blockNum, hashrate: totalHashrate}))

        //   console.log("stored",stored)
    }




}
