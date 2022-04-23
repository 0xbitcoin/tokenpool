
 
import Web3 from 'web3'
import web3utils from 'web3-utils'

import PeerHelper from './peer-helper.js'
import ContractHelper from './contract-helper.js'

import LoggingHelper from './logging-helper.js'

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
      
      
      
      
      return priceOracleData ? priceOracleData.price_ratio_eth : undefined
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

        
        if(ethBlockNumberRecord){
          return ethBlockNumberRecord.ethBlockNumber
        }
        
      return null 
   }


  static async collectTokenParameters(tokenContract, web3,  mongoInterface  )
  {
    if(typeof tokenContract == 'undefined'){
      console.log('WARN: Could not collect token parameters')
      return 
    }
    

    var miningDifficultyString = await tokenContract.methods.getMiningDifficulty().call()  ;
    var miningDifficulty = parseInt(miningDifficultyString)

    var miningTargetString = await tokenContract.methods.getMiningTarget().call()  ;
    var miningTarget = web3utils.toBN(miningTargetString)

    var challengeNumber = await tokenContract.methods.getChallengeNumber().call() ;


    var miningReward = await tokenContract.methods.getMiningReward().call() ;

    let unixTime = PeerHelper.getTimeNowSeconds()

    

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
  
  

    if (existingMiningContractData == null ||   challengeNumber != existingMiningContractData.challengeNumber) {


      let newMiningContractData = {
        challengeNumber: challengeNumber,
        miningTarget: miningTarget.toString(),
        miningDifficulty: miningDifficulty,
        miningReward: miningReward,
        updatedAt: unixTime
      }


    
      let updated =  await mongoInterface.upsertOne('miningContractData', {}, newMiningContractData )  // self.redisInterface.loadRedisData('challengeNumber' )
 
      LoggingHelper.appendLog( [ 'collectTokenParameters'   ], LoggingHelper.TYPECODES.GENERIC, mongoInterface)
 

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

  static async collectPoolAccountBalances(poolConfig,  mongoInterface  )
  {

    let mintingWeb3 = new Web3(poolConfig.mintingConfig.web3Provider)
    let paymentsWeb3 = new Web3(poolConfig.paymentsConfig.web3Provider)

    let mintingAccountAddress = poolConfig.mintingConfig.publicAddress
    let paymentsAccountAddress = poolConfig.paymentsConfig.publicAddress

    let batchedPaymentsContractAddress = ContractHelper.getBatchedPaymentContractAddress(poolConfig)

     
    const mintingTokenContract = ContractHelper.getMintingTokenContract( mintingWeb3,  poolConfig  )  
    const paymentsTokenContract = ContractHelper.getPaymentsTokenContract( paymentsWeb3,  poolConfig  )  

   

     
    let poolAccountBalances = {  
       mintingAccountBalances: {},
       paymentsAccountBalances: {},
       tokensApprovedToBatchPayments:0 ,
       updatedAt: PeerHelper.getTimeNowSeconds()

    }

    poolAccountBalances.mintingAccountBalances['ETH'] = await mintingWeb3.eth.getBalance(mintingAccountAddress);
    poolAccountBalances.paymentsAccountBalances['ETH'] = await paymentsWeb3.eth.getBalance(paymentsAccountAddress);

    poolAccountBalances.mintingAccountBalances['token'] = await mintingTokenContract.methods.balanceOf(mintingAccountAddress).call()
    poolAccountBalances.paymentsAccountBalances['token'] = await paymentsTokenContract.methods.balanceOf(paymentsAccountAddress).call()

    poolAccountBalances.tokensApprovedToBatchPayments = await paymentsTokenContract.methods.allowance(paymentsAccountAddress, batchedPaymentsContractAddress  ).call()


    let updated =  await mongoInterface.upsertOne('poolAccountBalances', {}, poolAccountBalances )  // self.redisInterface.loadRedisData('challengeNumber' )
 
    LoggingHelper.appendLog( ['collectPoolAccountBalances' , poolAccountBalances ], LoggingHelper.TYPECODES.GENERIC, mongoInterface)
 
  }

 
  
  static async getChallengeNumber(mongoInterface){
    let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)

   return recentMiningContractData.challengeNumber 

}

//there should only ever be one miningContractData record 
static async getRecentMiningContractData(mongoInterface){

    return await mongoInterface.findOne('miningContractData', {} )   

 }

 static async getPoolAccountBalancesData(mongoInterface){
     return await mongoInterface.findOne('poolAccountBalances', {} ) 

 }





}