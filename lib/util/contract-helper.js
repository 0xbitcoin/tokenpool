
var web3utils = require('web3-utils')

var tokenContractJSON = require('../../src/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../../src/contracts/MintHelper.json');
 
var paymentContractJSON = require('../../src/contracts/BatchedPayments.json');
var deployedContractInfo = require('../../src/config/DeployedContractInfo.json');



module.exports =  {

  async getNetworkName( web3 ){
    let netId = await web3.eth.net.getId()


    if(netId == 1) {return 'production'}

    return 'test'
  },

  async getTokenContract(web3 )
  {
    let networkName = await this.getNetworkName( web3 )
    var contract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress(networkName));
    return contract;
  },
  /*getMiningKingContract(web3 )
  {
    var contract = new web3.eth.Contract(miningKingContractJSON.abi,this.getMiningKingAddress(pool_env));
    return contract;
  },*/
  async getMintHelperContract(web3 )
  {
    let networkName = await this.getNetworkName( web3 )
    var contract = new web3.eth.Contract(mintHelperContractJSON.abi,this.getMintHelperAddress(networkName));
    return contract;
  },
  async getPaymentContract(web3 )
  {
    let networkName = await this.getNetworkName( web3 )
    var contract =  new web3.eth.Contract(paymentContractJSON.abi,this.getPaymentContractAddress(networkName));
    return contract;
  },/* 
  getDoubleKingsRewardContract(web3 )
  {
    var contract =  new web3.eth.Contract(doubleKingsRewardJSON.abi,this.getDoubleKingsRewardContractAddress(pool_env));
    return contract;
  },*/





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
