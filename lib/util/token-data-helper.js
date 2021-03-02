



export default class TokenDataHelper {

   
    
    static async getChallengeNumber(mongoInterface){
        let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

       return recentMiningContractData.challengeNumber 

    }

    //there should only ever be one   record 
    static async getRecentMiningContractData(mongoInterface){

        return await mongoInterface.findOne('miningContractData', {} )  // self.redisInterface.loadRedisData('challengeNumber' )
 
     }

      //there should only ever be one   record 
     static async getEthBlockNumber(mongoInterface){

      return await mongoInterface.findOne('ethBlockNumber', {} )   

   }


  static async collectTokenParameters(tokenContract, web3,  mongoInterface  )
  {


    var miningDifficultyString = await tokenContract.methods.getMiningDifficulty().call()  ;
    var miningDifficulty = parseInt(miningDifficultyString)

    var miningTargetString = await tokenContract.methods.getMiningTarget().call()  ;
    var miningTarget = web3Utils.toBN(miningTargetString)

    var challengeNumber = await tokenContract.methods.getChallengeNumber().call() ;



    let existingMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)



      var web3 = this.web3;
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
    if (challengeNumber != existingMiningContractData.challengeNumber) {


      let newMiningContractData = {
        challengeNumber: challengeNumber,
        miningTarget: miningTarget.toString(),
        miningDifficulty: miningDifficulty
      }


      let updated =  await mongoInterface.upsertOne('miningContractData', {}, newMiningContractData )  // self.redisInterface.loadRedisData('challengeNumber' )
 


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


    let updatedEthBlock =  await mongoInterface.upsertOne('ethBlockNumber', {}, ethBlockNumber )  // self.redisInterface.loadRedisData('challengeNumber' )
 

 

  } 

 





}