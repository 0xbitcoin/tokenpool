
var web3utils = require('web3-utils')

var tokenContractJSON = require('../../src/contracts/_0xBitcoinToken.json');
var mintHelperContractJSON = require('../../src/contracts/MintHelper.json');
 
var paymentContractJSON = require('../../src/contracts/BatchedPayments.json');
var deployedContractInfo = require('../../src/config/DeployedContractInfo.json');



module.exports =  {

  

  async getTokenContract(web3 , poolConfig  )
  {
   
    var contract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress(poolConfig));
    return contract;
  },
  /*getMiningKingContract(web3 )
  {
    var contract = new web3.eth.Contract(miningKingContractJSON.abi,this.getMiningKingAddress(pool_env));
    return contract;
  },
  async getMintHelperContract(web3, pool_env )
  {
   
    var contract = new web3.eth.Contract(mintHelperContractJSON.abi,this.getMintHelperAddress(pool_env));
    return contract;
  },*/
  async getBatchedPaymentsContract(web3, poolConfig )
  {
   
    var contract =  new web3.eth.Contract(paymentContractJSON.abi,this.getBatchedPaymentContractAddress(poolConfig));
    return contract;
  },/* 
  getDoubleKingsRewardContract(web3 )
  {
    var contract =  new web3.eth.Contract(doubleKingsRewardJSON.abi,this.getDoubleKingsRewardContractAddress(pool_env));
    return contract;
  },*/

 

       getTokenContractAddress(poolConfig)
       {

         let pool_env = poolConfig.poolEnv 
  
         let networkName = poolConfig.mintingConfig.networkName

         var address= deployedContractInfo.networks[networkName].contracts._0xbitcointoken.blockchain_address;
        

         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       },

      

       getBatchedPaymentContractAddress(poolConfig)
       {
        let pool_env = poolConfig.poolEnv 

        let networkName = poolConfig.paymentsConfig.networkName

        console.log('networkname', networkName)

         var address= deployedContractInfo.networks[networkName].contracts.batchedpayments.blockchain_address;
         

         return web3utils.toChecksumAddress(address)
         console.error('no pool env set', pool_env)
       },

      

}
