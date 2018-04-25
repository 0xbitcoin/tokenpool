

   var web3utils =  require('web3-utils');


   var pjson = require('../package.json');

module.exports =  {


  async init( web3, accountConfig, poolConfig , redisInterface ,testmode  )
  {

    this.web3=web3;
    this.accountConfig =accountConfig;
    this.poolConfig=poolConfig;
    this.redisInterface=redisInterface;
    this.testmode=testmode;

    this.poolVersion = pjson.version;
  },



    async getMinerBalancePayments(minerAddress,limitAmount)
    {

      var ethereumTransactions = await this.redisInterface.getRecentElementsOfListInRedis(('balance_payments:'+minerAddress.toString()),limitAmount)

      return ethereumTransactions;


    },


    async getPendingBalanceTransfers(  )
    {
      var pending_transfers = [];

      var payment_txes = await this.redisInterface.getResultsOfKeyInRedis('balance_payment')

      var currentEthBlock = await this.redisInterface.getEthBlockNumber();

      var REBROADCAST_WAIT_BLOCKS = 250;

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

    //  var ethereumTransactions = await this.redisInterface.getRecentElementsOfListInRedis(('balance_payments:'+minerAddress.toString()),limitAmount)

      return pending_transfers;


    },

    async getMinerBalanceTransfers(minerAddress,limitAmount)
    {

      var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis(('balance_transfers:'+minerAddress.toString()), limitAmount)

      return ethereumTransactionList;


    },


    async getMinerSubmittedShares(minerAddress,limitAmount)
    {
        var sharesList = await this.redisInterface.getRecentElementsOfListInRedis(('miner_submitted_share:'+minerAddress.toString()), limitAmount)

        return sharesList;
   },

   async getMinerInvalidShares(minerAddress,limitAmount)
   {
       var sharesList = await this.redisInterface.getRecentElementsOfListInRedis(('miner_invalid_share:'+minerAddress.toString()), limitAmount)

       return sharesList;
   },

  //most recent
  async getActiveTransactionData(limitAmount)
  {

    var ethereumTransactions = await this.redisInterface.getRecentElementsOfListInRedis('active_transactions_list',limitAmount)

    return ethereumTransactions;


  },

  async getQueuedTransactionData(limitAmount)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('queued_transactions', limitAmount)


    return ethereumTransactionList;


  },

  async getQueuedReplacementPaymentData(limitAmount)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('queued_replacement_payment', limitAmount)

    return ethereumTransactionList;

  },

  async getUnconfirmedBroadcastedPaymentData(limitAmount)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('unconfirmed_broadcasted_payment', limitAmount)

    return ethereumTransactionList;

  },



  async getHashrateData(limitAmount)
  {

    var ethereumTransactionList = await this.redisInterface.getRecentElementsOfListInRedis('total_pool_hashrate', limitAmount)


    return ethereumTransactionList;


  },

  async getSubmittedShares(limitAmount)
  {
    var existingShares = await this.redisInterface.getRecentElementsOfListInRedis('submitted_shares_list',limitAmount)


    return existingShares;

  },


  async getSubmittedSolutions(limitAmount)
  {
    var existingSolutions = await this.redisInterface.getRecentElementsOfListInRedis('submitted_solutions_list',limitAmount)


    return existingSolutions;

  },


  getNetworkName()
  {
    if(this.testmode)
    {
      return 'TESTNET'
    }
    return 'MAINNET'
  },


    async getChallengeNumber()
    {
      return this.redisInterface.loadRedisData('challengeNumber')

    },
    async getBlockNumber()
    {
      return this.redisInterface.loadRedisData('ethBlockNumber')

    },

  async getPoolConfig()
  {
    return {
      poolConfig: this.poolConfig,
      poolVersion: this.poolVersion,
      AccountAddress: this.accountConfig.address
    }
  },

  async getPoolStats()
  {


    return {
      networkType: this.getNetworkName(),
      ChallengeNumber: await this.getChallengeNumber(),
      blockNumber:  await this.getBlockNumber(),
      TxQueued: await this.redisInterface.loadRedisData('queuedTxCount'),
      TxPending: await this.redisInterface.loadRedisData('pendingTxCount'),
      TxMined: await this.redisInterface.loadRedisData('minedTxCount'),
      TxSuccess: await this.redisInterface.loadRedisData('successTxCount'),
      lastRewardAmount: 0,
      lastRewardEthBlockNumber: 0
    }
  },





}
