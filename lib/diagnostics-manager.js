
/*


  Save certain stats to redis every hour


*/

import PoolStatsHelper from './util/pool-stats-helper' 
import PeerHelper from './util/peer-helper' 
import TokenDataHelper from './util/token-data-helper' 

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
        var totalHashrate = await PeerHelper.getTotalMinerHashrate(this.mongoInterface);

        var blockNum = await TokenDataHelper.getEthBlockNumber(this.mongoInterface)

        //var stored = await this.redisInterface.pushToRedisList('total_pool_hashrate', JSON.stringify({block: blockNum, hashrate: totalHashrate}))

        //   console.log("stored",stored)
    }




}
