
/*


  Save certain stats to redis every hour


*/

import PoolStatsHelper from './util/pool-stats-helper.js' 
import PeerHelper from './util/peer-helper.js' 
import TokenDataHelper from './util/token-data-helper.js' 
import Web3ApiHelper from './util/web3-api-helper.js';

var STAT_COLLECTION_PERIOD = 60*60*1000;

export default class DiagnosticsManager {



    async init( poolConfig, mongoInterface )
    {


      this.mongoInterface = mongoInterface;
      this.poolConfig = poolConfig 
     
  


    } 

    async update(){
      setInterval(this.collectStats.bind(this),STAT_COLLECTION_PERIOD);

      setTimeout(this.collectStats.bind(this),5*1000);


      setInterval(this.monitorPoolStatus.bind(this),8*1000);

      setTimeout(this.monitorPoolStatus.bind(this),1*1000);
    } 

    async collectStats()
    {

       console.log("COLLECT STATS")
        var totalHashrate = await PeerHelper.getTotalMinerHashrate(this.mongoInterface);

        var blockNum = await TokenDataHelper.getEthBlockNumber(this.mongoInterface)

        //var stored = await this.redisInterface.pushToRedisList('total_pool_hashrate', JSON.stringify({block: blockNum, hashrate: totalHashrate}))

        //   console.log("stored",stored)
    } 

    async monitorPoolStatus(){
      let mongoInterface = this.mongoInterface 
      let poolConfig = this.poolConfig

      console.log("monitorPoolStatus1")

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


      if( priceOracleData.updatedAt <  unixTimeNow - ONE_HOUR ){
        poolStatus = 'suspended'
        suspensionReason = 'Price oracle stale'
      }

      /*if( gasPriceData.blockNumber <  ethBlockNumber - 200  && gasPriceData.networkName.toLowerCase() == poolConfig.mintingConfig.networkName.toLowerCase() ){
        poolStatus = 'suspended'
        suspensionReason = 'Gas oracle stale'
      }*/
  

      if( gasPriceData.updatedAt <  unixTimeNow - ONE_HOUR ){
        poolStatus = 'suspended'
        suspensionReason = 'Gas oracle stale'
      }

      console.log("monitorPoolStatus2", poolStatus , mongoInterface)

      
      await mongoInterface.upsertOne('poolStatus', {}, {
        blockNumber: ethBlockNumber,  
        poolStatus: poolStatus, 
        suspensionReason: suspensionReason,
        poolFeesMetrics: poolFeesMetrics,
        updatedAt: unixTimeNow
      })

    }


}
