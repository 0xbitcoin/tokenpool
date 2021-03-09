

/*

  WEB3PLUG.js  --  By InfernalToast
  A mini connector in order to abstract the metamask/web3 API into a custom event emitter that is simpler and more predictable



 >>> HOW TO USE

  let web3Plug = new Web3Plug()

  this.web3Plug.getPlugEventEmitter().on('stateChanged', function(connectionState) {
        console.log('stateChanged',connectionState);

        // CUSTOM CODE HERE
        this.activeAccountAddress = connectionState.activeAccountAddress
        this.activeNetworkId = connectionState.activeNetworkId
        // END CUSTOM CODE

      }.bind(this));

   this.web3Plug.getPlugEventEmitter().on('error', function(errormessage) {
        console.error('error',errormessage);

        //CUSTOM CODE HERE
        this.web3error = errormessage
        // END CUSTOM CODE
      }.bind(this));


  this.web3Plug.connectWeb3( )


  let networkName = this.web3Plug.getWeb3NetworkName(this.activeNetworkId)

  let contractData = this.web3Plug.getContractDataForNetworkID(this.activeNetworkId)

  let myTokenContract = this.web3Plug.getTokenContract(window.web3, contractData['weth'].address)

  myTokenContract.methods.transferFrom( {...} ).send( {from: ....} )
        .on('receipt', function(){
            ...
        });



*/






const Web3 = require('web3');
const web3utils = Web3.utils;
const BigNumber = Web3.utils.BN;

const contractData = require('../config/contractdata.json')

const EventEmitter = require('events');
class Web3PlugEmitter extends EventEmitter {}

const web3PlugEmitter = new Web3PlugEmitter();



  const mainnetChainID = 1
  const goerliChainId = 5 
  const kovanChainID = 42




export default class Web3Plug {

  async connectWeb3(   ){

    console.log('connectWeb3')

    if (window.ethereum) {
         window.web3 = new Web3(window.ethereum);
         window.ethereum.enable();

         window.ethereum.on('accountsChanged', (accounts) => {
                  web3PlugEmitter.emit('stateChanged', this.getConnectionState() )
          });

         window.ethereum.on('chainChanged', (chainId) => {
                  web3PlugEmitter.emit('stateChanged', this.getConnectionState() )
           });


        web3PlugEmitter.emit('stateChanged', this.getConnectionState() )

      }else{
        web3PlugEmitter.emit('error', "No web3 provider found." )
      }
  }

  getPlugEventEmitter(){
    return web3PlugEmitter
  }

  getConnectionState(){
    return {
      activeAccountAddress: window.ethereum.selectedAddress,
      activeNetworkId: window.ethereum.chainId
    }
  }

  static getWeb3NetworkName(networkId){

    if(networkId == mainnetChainID){
      return 'mainnet'
    }

    if(networkId == kovanChainID){
      return 'kovan'
    }

    if(networkId == goerliChainId){
      return 'goerli'
    }


    

     console.error('Invalid network Id: ',networkId)
    return null
  }


  getContractDataForNetworkID(networkId){
    let netName = this.getWeb3NetworkName(networkId)

    if(netName){
        return contractData[netName].contracts
    }

    return undefined
  }


  async getConnectedAccounts()
  {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts;
  }


  getTokenContract(web3, contractAddress)
  {

    var tokenContract = new web3.eth.Contract(tokenContractABI,contractAddress)

    return tokenContract;
  }


  getCustomContract(web3, contractABI, contractAddress)
  {

    var contract = new web3.eth.Contract(contractABI,contractAddress)

    return contract;
  }

  async getETHBalance(ownerAddress)
  {
    var web3 = new Web3(Web3.givenProvider);

    return web3.eth.getBalance(ownerAddress);
  }

  async getTokenBalance(contractAddress, ownerAddress)
  {
    var web3 = new Web3(Web3.givenProvider);

    var tokenContract = new web3.eth.Contract(tokenContractABI, contractAddress, {});


    var balance = await tokenContract.methods.balanceOf(ownerAddress).call();

    return balance;
  }


  rawAmountToFormatted(amount,decimals)
  {
    return (amount * Math.pow(10,-1 * decimals)).toFixed(decimals);
  }

  formattedAmountToRaw(amountFormatted,decimals)
  {

    var multiplier = new BigNumber( 10 ).exponentiatedBy( decimals ) ;


    return multiplier.multipliedBy(amountFormatted).toFixed() ;
  }

/*
  async connect()
  {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts
  },

  async disconnect()
  {
    console.log('disconnecting')
    const accounts = await window.ethereum.request({
     method: "eth_requestAccounts",
     params: [
       {
         eth_accounts: {}
       }
     ]
   });
   window.location.reload();
 }*/



}
