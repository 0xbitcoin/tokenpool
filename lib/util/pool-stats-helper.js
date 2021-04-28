
 
import web3utils from 'web3-utils'

   import Web3ApiHelper from './web3-api-helper.js'
   import TokenDataHelper from './token-data-helper.js'
   import PeerHelper from './peer-helper.js'
   import TransactionHelper from './transaction-helper.js'
   import ContractHelper from './contract-helper.js'

 

export default class PoolStatsHelper {
 


   static async getAllMinerData(  mongoInterface)
    {   
      var allMinerData  = await PeerHelper.getMinerList(mongoInterface)
 
      return allMinerData

    }

       static async getAllTransactionData(  mongoInterface)
    { 

      let txList = await TransactionHelper.findTransactionsWithQuery({}, mongoInterface)
       
      return txList

    }


    static async getPoolData(poolConfig,  mongoInterface)
    { 
      var gasPriceData = await Web3ApiHelper.getGasPriceData( mongoInterface )
      let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)
      let ethBlockNumber = await TokenDataHelper.getEthBlockNumber(mongoInterface)


      let batchedPaymentsContractAddress = ContractHelper.getBatchedPaymentContractAddress( poolConfig )
       
      return {
        gasPrices: gasPriceData,
        miningContract: recentMiningContractData,
        ethBlockNumber: ethBlockNumber,
        mintingAddress: poolConfig.mintingConfig.publicAddress,
        mintingNetwork: poolConfig.mintingConfig.networkName,
        maxSolutionGasPriceWei: poolConfig.mintingConfig.maxSolutionGasPriceWei,
        paymentsAddress: poolConfig.paymentsConfig.publicAddress,
        paymentsNetwork: poolConfig.paymentsConfig.networkName,
        batchedPaymentsContractAddress: batchedPaymentsContractAddress,
        minBalanceForPayment: poolConfig.paymentsConfig.minBalanceForTransfer
      }

    }

    static getPoolProtocolVersion(){
      return "1.11"
    }

    static async getPoolStatus(poolConfig,  mongoInterface)
    {
       return await mongoInterface.findOne('poolStatus', {} )
    }


    static async poolMintingIsSuspended(poolConfig,  mongoInterface)
    {
       let poolStatus = await PoolStatsHelper.getPoolStatus(poolConfig,mongoInterface)

       let isSuspended = poolStatus.poolStatus != 'active'

       return (isSuspended && (poolConfig.mintingConfig.overrideSuspension != true))
    }

 

  async getHashrateData(limitAmount)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('total_pool_hashrate', limitAmount)


    return ethereumTransactionList;


  } 

  async getSubmittedShares(limitAmount)
  {
    var existingShares = await this.redisInterface.getRecentElementsOfListInRedis('submitted_shares_list',limitAmount)


    return existingShares;

  } 


  async getSubmittedSolutions(limitAmount)
  {
    var existingSolutions = await this.redisInterface.getRecentElementsOfListInRedis('submitted_solutions_list',limitAmount)


    return existingSolutions;

  } 
 
  static async getPoolStats(mongoInterface)
  {


    return {
      networkType: this.getNetworkName(),
      ChallengeNumber: await this.getChallengeNumber(),
      blockNumber:  await this.getBlockNumber(),
      TxQueued: await this.redisInterface.loadRedisData('queuedTxCount'),
      TxPending: await this.redisInterface.loadRedisData('pendingTxCount'),

      MintsTxQueued: await this.redisInterface.loadRedisData('queuedMintsCount'),
      MintsTxPending: await this.redisInterface.loadRedisData('pendingMintsCount'),

      PaymentsTxQueued: await this.redisInterface.loadRedisData('queuedPaymentsCount'),
      PaymentsTxPending: await this.redisInterface.loadRedisData('pendingPaymentsCount'),

      TxMined: await this.redisInterface.loadRedisData('minedTxCount'),
      TxSuccess: await this.redisInterface.loadRedisData('successTxCount'),
      lastRewardAmount: 0,
      lastRewardEthBlockNumber: 0,



      totalPoolFeeTokens: await this.redisInterface.loadRedisData('totalPoolFeeTokens' ),
      totalCommunityFeeTokens:  await this.redisInterface.loadRedisData('totalCommunityFeeTokens' )
    }
  } 





}
