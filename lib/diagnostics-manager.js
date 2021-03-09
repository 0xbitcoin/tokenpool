
/*


  Save certain stats to redis every hour


*/

import PoolStatsHelper from './util/pool-stats-helper' 
import PeerHelper from './util/peer-helper' 
import TokenDataHelper from './util/token-data-helper' 
import Web3ApiHelper from './util/web3-api-helper';

var STAT_COLLECTION_PERIOD = 60*60*1000;

module.exports =  {



    async init( poolConfig, mongoInterface )
    {


      this.mongoInterface = mongoInterface;
      this.poolConfig = poolConfig 
     
  


    },

    async update(){
      setInterval(this.collectStats.bind(this),STAT_COLLECTION_PERIOD);

      setTimeout(this.collectStats.bind(this),5*1000);


      setInterval(this.monitorPoolStatus.bind(this),8*1000);

      setTimeout(this.monitorPoolStatus.bind(this),1*1000);
    },

    async collectStats()
    {

       console.log("COLLECT STATS")
        var totalHashrate = await PeerHelper.getTotalMinerHashrate(this.mongoInterface);

        var blockNum = await TokenDataHelper.getEthBlockNumber(this.mongoInterface)

        //var stored = await this.redisInterface.pushToRedisList('total_pool_hashrate', JSON.stringify({block: blockNum, hashrate: totalHashrate}))

        //   console.log("stored",stored)
    },

    async monitorPoolStatus(){
      let mongoInterface = this.mongoInterface 
      let poolConfig = this.poolConfig

      console.log("monitorPoolStatus")

      let unixTimeNow = PeerHelper.getUnixTimeNow()
      let ethBlockNumber = await TokenDataHelper.getEthBlockNumber(mongoInterface)


      let priceOracleData = TokenDataHelper.getPriceOracleData(mongoInterface)
      let gasPriceData = Web3ApiHelper.getGasPriceWeiForTxType('solution',poolConfig,mongoInterface)

      let poolStatus = 'active'
      let suspensionReason = null 

      const ONE_HOUR = 60*60; 
      
     
      let poolFeesMetrics = await PeerHelper.getPoolFeesMetrics(poolConfig, mongoInterface)
      let poolFeesFactor = poolFeesMetrics.overallFeeFactor
       console.log('poolfeesfactor', poolFeesFactor)

      if( isNaN(poolFeesFactor) || poolFeesFactor > 0.98 ){
        poolStatus = 'suspended'
        suspensionReason = 'Avg Tx Fee Too High'
      }


      if( priceOracleData.last_updated <  unixTimeNow - ONE_HOUR ){
        poolStatus = 'suspended'
        suspensionReason = 'Price oracle stale'
      }

      if( gasPriceData.blockNumber <  ethBlockNumber - 200  && gasPriceData.networkName.toLowerCase() == poolConfig.mintingConfig.networkName.toLowerCase() ){
        poolStatus = 'suspended'
        suspensionReason = 'Gas oracle stale'
      }
 
      
      await mongoInterface.upsertOne('poolStatus', {}, {
        blockNumber: ethBlockNumber,  
        poolStatus: poolStatus, 
        suspensionReason: suspensionReason,
        poolFeesMetrics: poolFeesMetrics,
        updatedAt: unixTimeNow
      })

    }


}
