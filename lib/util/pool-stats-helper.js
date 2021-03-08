

   var web3utils =  require('web3-utils');

   import Web3ApiHelper from './web3-api-helper'
   import TokenDataHelper from './token-data-helper'
   import PeerHelper from './peer-helper'
   import TransactionHelper from './transaction-helper'

//   var pjson = require('../../../package.json');

export default class PoolStatsHelper {

/*
  async init( web3, accountConfig, poolConfig , redisInterface , mongoInterface, pool_env  )
  {

    this.web3=web3;
    this.accountConfig =accountConfig;
    this.poolConfig=poolConfig;
    this.redisInterface=redisInterface;
    this.mongoInterface=mongoInterface;
    this.pool_env=pool_env;


    this.poolVersion = pjson.version;
  },*/


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
      var averageGasPriceWei = await Web3ApiHelper.getAverageGasPriceWei( mongoInterface )
      let recentMiningContractData = await TokenDataHelper.getRecentMiningContractData(mongoInterface)
      let ethBlockNumber = await TokenDataHelper.getEthBlockNumber(mongoInterface)

       
      return {
        gasPrices: averageGasPriceWei,
        miningContract: recentMiningContractData,
        ethBlockNumber: ethBlockNumber,
        mintingAddress: poolConfig.mintingConfig.publicAddress,
        mintingNetwork: poolConfig.mintingConfig.networkName,
        maxSolutionGasPriceWei: poolConfig.mintingConfig.maxSolutionGasPriceWei,
        paymentsAddress: poolConfig.paymentsConfig.publicAddress,
        paymentsNetwork: poolConfig.paymentsConfig.networkName,
        minBalanceForPayment: poolConfig.paymentsConfig.minBalanceForTransfer
      }

    }



/*
    static async getPendingBalanceTransfers( mongoInterface  )
    {
      var pending_transfers = [];

      var payment_txes = await this.redisInterface.getResultsOfKeyInRedis('balance_payment')

      var currentEthBlock = await this.redisInterface.getEthBlockNumber();


      for(i in payment_txes)
      {
        var paymentId = payment_txes[i];

       var paymentDataJSON = await this.redisInterface.findHashInRedis('balance_payment',paymentId);
       var paymentData = JSON.parse(paymentDataJSON)

       var txDataJSON = await this.redisInterface.findHashInRedis('payment_tx',paymentId);
       var txData = JSON.parse(txDataJSON)

       var balanceTransferJSON = await this.redisInterface.findHashInRedis('balance_transfer',paymentId);
       var transferData = JSON.parse(balanceTransferJSON)


       if( balanceTransferJSON!= null &&  transferData.confirmed != true   )
       {
          pending_transfers.push(  transferData  )
       }

      }

    
      return pending_transfers;


    },*/

    /*
    static async getMinerBalanceTransfers(minerAddress,limitAmount, mongoInterface)
    {
      var ethereumTransactionList = [];
      var transfer_keys = await this.redisInterface.getResultsOfKeyInRedis('balance_transfer:'+minerAddress.toString().toLowerCase())

      for(i in transfer_keys)
      {
        var transferId = transfer_keys[i];
        var transferDataJSON = await this.redisInterface.findHashInRedis('balance_transfer:'+minerAddress.toString().toLowerCase(),transferId);
        var transferData = JSON.parse(transferDataJSON)

        if( transferDataJSON != null &&  transferData.confirmed    )
        {
          ethereumTransactionList.push(transferData)
        }
      }

      //var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis(('balance_transfers:'+minerAddress.toString()), limitAmount)

      return ethereumTransactionList;

    } */

    /*
    static async getMinerUnsuccessfulBalanceTransfers(minerAddress,limitAmount, mongoInterface)
    {
      var ethereumTransactionList = [];
      var transfer_keys = await this.redisInterface.getResultsOfKeyInRedis('balance_transfer:'+minerAddress.toString().toLowerCase())

      for(i in transfer_keys)
      {
        var transferId = transfer_keys[i];
        var transferDataJSON = await this.redisInterface.findHashInRedis('balance_transfer:'+minerAddress.toString().toLowerCase(),transferId);
        var transferData = JSON.parse(transferDataJSON)

        if( transferDataJSON == null ||  transferData.confirmed != true    )
        {
          ethereumTransactionList.push(transferData)
        }
      }

      //var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis(('balance_transfers:'+minerAddress.toString().toLowerCase()), limitAmount)

      return ethereumTransactionList;

    }*/


    /*
   static async getMinerSubmittedShares(minerAddress,limitAmount, mongoInterface)
    {
        var sharesList = await this.redisInterface.getRecentElementsOfListInRedis(('miner_submitted_share:'+minerAddress.toString().toLowerCase()), limitAmount)

        return sharesList;
   }*/

   /*
   static async getMinerInvalidShares(minerAddress,limitAmount, mongoInterface)
   {
       var sharesList = await this.redisInterface.getRecentElementsOfListInRedis(('miner_invalid_share:'+minerAddress.toString().toLowerCase()), limitAmount)

       return sharesList;
   }*/

  /*
 static async getActiveTransactionData(limitAmount, mongoInterface)
  {

    var ethereumTransactions = await this.redisInterface.getRecentElementsOfListInRedis('active_transactions_list',limitAmount)

    return ethereumTransactions;


  }*/

  /*
  static async getQueuedTransactionData(limitAmount, mongoInterface)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('queued_payment_transactions', limitAmount)


    return ethereumTransactionList;


  }*/

  /*
  static async getQueuedReplacementPaymentData(limitAmount, mongoInterface)   
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('queued_replacement_payment', limitAmount)

    return ethereumTransactionList;

  } 

  static async getUnconfirmedBroadcastedPaymentData(limitAmount, mongoInterface)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('unconfirmed_broadcasted_payment', limitAmount)

    return ethereumTransactionList;

  } 
*/


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

/*
  getNetworkName()
  {

    return this.pool_env
  }*/


   /*static async getChallengeNumber(mongoInterface)
    {
      let challengeNumber= await this.redisInterface.loadRedisData('challengeNumber')
      console.log(  'give client challenge number: ', challengeNumber)
     
      return challengeNumber

    } 
    static async getBlockNumber(mongoInterface)
    {
      return await this.redisInterface.loadRedisData('ethBlockNumber')

    } 
*/
/*  static async getPoolConfig()
  {
    return {
      poolConfig: this.poolConfig,
      poolVersion: this.poolVersion,
      AccountAddress: this.accountConfig.address
    }
  } */

  //fixme ? 
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
