
 
import web3utils from 'web3-utils'

import PeerHelper from './peer-helper.js'

export default class TokenDataHelper {

   
    
    static async getChallengeNumber(mongoInterface){
        let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

       return recentMiningContractData.challengeNumber 

    }


    static async getMiningDifficultyTarget(mongoInterface){
      let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

     return recentMiningContractData.miningDifficulty

  }

    static async getMiningReward(mongoInterface){
      let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

    return recentMiningContractData.miningReward

  }
 
    static async getMineableTokenToEthPriceRatio(mongoInterface){

      let priceOracleData = await TokenDataHelper.getPriceOracleData(mongoInterface)
        return priceOracleData.price_ratio_eth 
    }

    static async getPriceOracleData(mongoInterface){

       return  await mongoInterface.findOne('priceOracle', {} )
         
    } 


    static async getPoolDifficultyTarget(mongoInterface){
      let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

     return recentMiningContractData.miningTarget 

  }

    //there should only ever be one   record 
    static async getRecentMiningContractData(mongoInterface){

        return await mongoInterface.findOne('miningContractData', {} )  // self.redisInterface.loadRedisData('challengeNumber' )
 
     }

      //there should only ever be one   record 
     static async getEthBlockNumber(mongoInterface){

      let ethBlockNumberRecord =  await mongoInterface.findOne('ethBlockNumber', {} ) 

        console.log('ethBlockNumberRecord', ethBlockNumberRecord)

        if(ethBlockNumberRecord){
          return ethBlockNumberRecord.ethBlockNumber
        }
        
      return null 
   }


  static async collectTokenParameters(tokenContract, web3,  mongoInterface  )
  {

    

    var miningDifficultyString = await tokenContract.methods.getMiningDifficulty().call()  ;
    var miningDifficulty = parseInt(miningDifficultyString)

    var miningTargetString = await tokenContract.methods.getMiningTarget().call()  ;
    var miningTarget = web3utils.toBN(miningTargetString)

    var challengeNumber = await tokenContract.methods.getChallengeNumber().call() ;


    var miningReward = await tokenContract.methods.getMiningReward().call() ;

    let unixTime = PeerHelper.getUnixTimeNow()

    

    var existingMiningContractData = null


    try{ 
        existingMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)
    }catch(error){
      console.log(error)
    }
 
      var ethBlockNumber = await new Promise(function (fulfilled,error) {
            web3.eth.getBlockNumber(function(err, result)
          {
            if(err){error(err);return}
            console.log('eth block number ', result )
            fulfilled(result);
            return;
          });
       });

    // console.log('Mining difficulty:', miningDifficulty);
    // console.log('Mining target:', miningTargetString);

    // check if we've seen this challenge before

    let updatedEthBlock =  await mongoInterface.upsertOne('ethBlockNumber', {}, {ethBlockNumber: ethBlockNumber} )  // self.redisInterface.loadRedisData('challengeNumber' )
  
    console.log('collectTokenParameters1',ethBlockNumber)

    if (existingMiningContractData == null ||   challengeNumber != existingMiningContractData.challengeNumber) {


      let newMiningContractData = {
        challengeNumber: challengeNumber,
        miningTarget: miningTarget.toString(),
        miningDifficulty: miningDifficulty,
        miningReward: miningReward,
        updatedAt: unixTime
      }


    
      let updated =  await mongoInterface.upsertOne('miningContractData', {}, newMiningContractData )  // self.redisInterface.loadRedisData('challengeNumber' )
 

      console.log('collectTokenParameters2',updated)

     /* var seenBefore = await this.redisInterface.isElementInRedisList("recent_challenges", challengeNumber);
      if (!seenBefore) {
        this.challengeNumber = challengeNumber;
        console.log('New challenge:', challengeNumber);
        this.redisInterface.pushToRedisList("recent_challenges", challengeNumber);
        this.redisInterface.popLastFromRedisList("recent_challenges");
        this.redisInterface.storeRedisData('challengeNumber',challengeNumber)
      } else {
        console.log('Old challenge:', challengeNumber);
      }*/
    }

     

    
   
  } 

 
  
  static async getChallengeNumber(mongoInterface){
    let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

   return recentMiningContractData.challengeNumber 

}

//there should only ever be one miningContractData record 
static async getRecentMiningContractData(mongoInterface){

    return await mongoInterface.findOne('miningContractData', {} )  // self.redisInterface.loadRedisData('challengeNumber' )

 }





}