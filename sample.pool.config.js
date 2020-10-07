
var poolconfig = {
  minimumShareDifficulty: 105,
  maxSolutionGasPriceWei: 10,
  maxTransferGasPriceWei: 6,
  poolTokenFee: 5,
  communityTokenFee: 2,
  minBalanceForTransfer: 1500000000,
  allowCustomVardiff: false,
  rebroadcastPaymentWaitBlocks: 500,
  minPaymentsInBatch: 5
//  web3provider: "http://127.0.0.1:8545"
}


exports.config = poolconfig;
