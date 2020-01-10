
var web3utils = require('web3-utils')

var tokenContractJSON = require('../../app/assets/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../../app/assets/contracts/MintHelper.json');
var miningKingContractJSON = require('../../app/assets/contracts/MiningKing.json');
var doubleKingsRewardJSON = require('../../app/assets/contracts/DoubleKingsReward.json');

var paymentContractJSON = require('../../app/assets/contracts/BatchedPayments.json');
var deployedContractInfo = require('../../app/assets/contracts/DeployedContractInfo.json');



module.exports =  {

  getTokenContract(web3,pool_env)
  {
    var contract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress(pool_env));
    return contract;
  },
  getMiningKingContract(web3,pool_env)
  {
    var contract = new web3.eth.Contract(miningKingContractJSON.abi,this.getMiningKingAddress(pool_env));
    return contract;
  },
  getMintHelperContract(web3,pool_env)
  {
    var contract = new web3.eth.Contract(mintHelperContractJSON.abi,this.getMintHelperAddress(pool_env));
    return contract;
  },
  getPaymentContract(web3,pool_env)
  {
    var contract =  new web3.eth.Contract(paymentContractJSON.abi,this.getPaymentContractAddress(pool_env));
    return contract;
  },
  getDoubleKingsRewardContract(web3,pool_env)
  {
    var contract =  new web3.eth.Contract(doubleKingsRewardJSON.abi,this.getDoubleKingsRewardContractAddress(pool_env));
    return contract;
  },





       getTokenContractAddress(pool_env)
       {
         var address;
         if(pool_env == 'test')
         {
           address =  deployedContractInfo.networks.testnet.contracts._0xbitcointoken.blockchain_address;
         }else if(pool_env == 'staging'){
           address =  deployedContractInfo.networks.staging.contracts._0xbitcointoken.blockchain_address;
         }else if(pool_env == 'production'){
           address=  deployedContractInfo.networks.mainnet.contracts._0xbitcointoken.blockchain_address;
         }

         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       },

       getDoubleKingsRewardContractAddress(pool_env)
       {
         var address;
         if(pool_env == 'test')
         {
           address = deployedContractInfo.networks.testnet.contracts.doubleKingsReward.blockchain_address;
         }else if(pool_env == 'staging'){
           address = deployedContractInfo.networks.staging.contracts.doubleKingsReward.blockchain_address;
         }else if(pool_env == 'production'){
           address = deployedContractInfo.networks.mainnet.contracts.doubleKingsReward.blockchain_address;
         }
         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       },


       getPaymentContractAddress(pool_env)
       {
         var address;
         if(pool_env == 'test')
         {
           address = deployedContractInfo.networks.testnet.contracts.batchedpayments.blockchain_address;
         }else if(pool_env == 'staging'){
           address = deployedContractInfo.networks.staging.contracts.batchedpayments.blockchain_address;
         }else if(pool_env == 'production'){
           address = deployedContractInfo.networks.mainnet.contracts.batchedpayments.blockchain_address;
         }
         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       },

       getMintHelperAddress(pool_env)
       {
         var address;
         if(pool_env == 'test')
         {
           address =  deployedContractInfo.networks.testnet.contracts.mintforwarder.blockchain_address;
         }else if(pool_env == 'staging'){
           address =  deployedContractInfo.networks.staging.contracts.mintforwarder.blockchain_address;
         }else if(pool_env == 'production'){
           address =  deployedContractInfo.networks.mainnet.contracts.mintforwarder.blockchain_address;
         }
         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       },

       getMiningKingAddress(pool_env)
       {
         var address;
         if(pool_env == 'test')
         {
           address = deployedContractInfo.networks.testnet.contracts.miningking.blockchain_address;
         }else if(pool_env == 'staging'){
           address = deployedContractInfo.networks.staging.contracts.miningking.blockchain_address;
         }else if(pool_env == 'production'){
           address = deployedContractInfo.networks.mainnet.contracts.miningking.blockchain_address;
         }
         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       }

}
