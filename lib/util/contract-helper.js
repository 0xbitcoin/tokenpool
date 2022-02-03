
 
import web3utils from 'web3-utils'

import  fs from 'fs' 
import path from 'path'

import FileUtils from './file-utils.js'
 

let tokenContractJSON = FileUtils.readJsonFileSync('/src/contracts/_0xBitcoinToken.json');
let paymentContractJSON = FileUtils.readJsonFileSync('/src/contracts/UniqueBatchedPayments.json');
let deployedContractInfo = FileUtils.readJsonFileSync('/src/config/DeployedContractInfo.json');

  

export default class ContractHelper {

  
  //for minting only 
  //DEPRECATED
   static getTokenContract(web3 , poolConfig  )
  {
   
    var contract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress(poolConfig));
    return contract;
  } 

  static getMintingTokenContract(web3 , poolConfig  )
  {
   
    var contract =  new web3.eth.Contract(tokenContractJSON.abi,this.getMintingTokenContractAddress(poolConfig));
    return contract;
  } 

  static getPaymentsTokenContract(web3 , poolConfig  )
  {
   
    var contract =  new web3.eth.Contract(tokenContractJSON.abi, this.getPaymentsTokenContractAddress(poolConfig));
    return contract;
  } 


  static getBatchedPaymentsContract(web3, poolConfig )
  {
   
    var contract =  new web3.eth.Contract(paymentContractJSON,this.getBatchedPaymentContractAddress(poolConfig));
    return contract;
  } 
 
  //DEPRECATED
   static getTokenContractAddress(poolConfig)
      {

        let pool_env = poolConfig.poolEnv 

        let networkName = poolConfig.mintingConfig.networkName

        var address= deployedContractInfo.networks[networkName].contracts._0xbitcointoken.blockchain_address;
      

        return web3utils.toChecksumAddress(address)
      //  console.error('no pool env set', pool_env)
      } 


    static getMintingTokenContractAddress(poolConfig)
    {

      let pool_env = poolConfig.poolEnv 

      let networkName = poolConfig.mintingConfig.networkName

      var address= deployedContractInfo.networks[networkName].contracts._0xbitcointoken.blockchain_address;
    

      return web3utils.toChecksumAddress(address)
    //  console.error('no pool env set', pool_env)
    } 


   static getPaymentsTokenContractAddress(poolConfig)
   {

     let pool_env = poolConfig.poolEnv 

     let networkName = poolConfig.paymentsConfig.networkName

     var address= deployedContractInfo.networks[networkName].contracts._0xbitcointoken.blockchain_address;
   

     return web3utils.toChecksumAddress(address)
     //console.error('no pool env set', pool_env)
   } 
 
    

      static getBatchedPaymentContractAddress(poolConfig)
      {
      let pool_env = poolConfig.poolEnv 

      let networkName = poolConfig.paymentsConfig.networkName

       //console.log('networkname', networkName)

        var address= deployedContractInfo.networks[networkName].contracts.batchedpayments.blockchain_address;
        

        return web3utils.toChecksumAddress(address)
        //console.error('no pool env set', pool_env)
      } 
      

}
