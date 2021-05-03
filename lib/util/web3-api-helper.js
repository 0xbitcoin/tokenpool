 
import https from 'https'

const API_INTERVAL = 1000*30 // thirty seconds 
 

import  cron from 'node-cron' 

  //perform this with a robust task runner  - bree  and /tasks folder 

  import PeerHelper from './peer-helper.js'


import LoggingHelper from './logging-helper.js'


export default class Web3ApiHelper  {

  constructor(mongoInterface, poolConfig ){
  
    this.poolConfig=poolConfig;
    this.mongoInterface=mongoInterface;

  } 
  

   update(){

    //Web3ApiHelper.fetchAPIData(this.poolConfig,this.mongoInterface)
    //setInterval( function(){Web3ApiHelper.fetchAPIData(this.poolConfig,this.mongoInterface)}.bind(this), API_INTERVAL)  
 
 

    cron.schedule('*/20 * * * * *', async function() {
       

      //var web3 = new Web3(poolConfig.mintingConfig.web3Provider);

      //let tokenContract = await ContractHelper.getTokenContract(  web3 ,  poolConfig  )  
  
      //await TokenDataHelper.collectTokenParameters(  this.tokenContract,  this.web3,  this.mongoInterface) 
      Web3ApiHelper.fetchAPIData(this.poolConfig,this.mongoInterface)


    }.bind(this));

 
  } 

  static async fetchAPIData(poolConfig,mongoInterface){
    LoggingHelper.appendLog('fetch api data', LoggingHelper.TYPECODES.GENERIC, mongoInterface)
 

    try{  

      const defipulseApiUri = 'https://ethgasstation.info/json/ethgasAPI.json'//'https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key='

      let get_request_uri = defipulseApiUri // .concat( poolConfig.apiConfig.defiPulseApiKey )


      let unixTime = PeerHelper.getTimeNowSeconds()



      let api_response = await Web3ApiHelper.httpRequestURL(get_request_uri)
 
        //use average gas price
        if(api_response && api_response!=undefined && api_response.fast)
        {
            

          let priceEstimates = {
            networkName:'mainnet',
            blockNum: api_response.blockNum,
            fast: api_response.fast / 10,
            average: api_response.average / 10,
            safeLow: api_response.safeLow / 10,
            blockNumber: api_response.blockNum,
            safeLowWait: api_response.safeLowWait,
            avgWait: api_response.avgWait,
            fastWait: api_response.fastWait,
            updatedAt: unixTime
          }

          await  mongoInterface.upsertOne('ethGasPriceWei', {},  priceEstimates  )
          //await this.redisInterface.storeRedisData('ethGasPriceWei', JSON.stringify( ethgasPriceWei) )

          LoggingHelper.appendLog( [ 'stored gaspriceEstimates', priceEstimates ], LoggingHelper.TYPECODES.GENERIC, mongoInterface)

 
        } 


    }catch(e){
      console.log(e)
    }


    try{

      let get_request_uri =  poolConfig.apiConfig.coinGeckoApiURL

      let api_response = await Web3ApiHelper.httpRequestURL(get_request_uri)
 
        //use average gas price
        if(api_response.market_data && api_response.market_data.current_price)
        {
            

          let priceEstimates = {
            price_ratio_eth: api_response.market_data.current_price.eth,
            updatedAt: (Date.parse(api_response.last_updated) / 1000.0)
          }

          await  mongoInterface.upsertOne('priceOracle', {},  priceEstimates  )
          //await this.redisInterface.storeRedisData('ethGasPriceWei', JSON.stringify( ethgasPriceWei) )

          LoggingHelper.appendLog( ['stored priceOracle', priceEstimates], LoggingHelper.TYPECODES.GENERIC, mongoInterface)
 
        } 


    }catch(e){
      console.log(e)
    }

  } 

  static async httpRequestURL(get_request_uri){

    return new Promise(   (resolve, reject) => {
      https.get(get_request_uri, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
        data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {

          let parsedData = null

          try{
            parsedData = JSON.parse(data)
          }catch(e){
            console.error(e)
          }

           

          if(parsedData){
            resolve(parsedData)
          }else{
            reject(false)
          }

        //  resolve( JSON.parse(data) )
        });

        }).on("error", (err) => {
          reject(err)
      });

    })

  }

  /*

  This should adapt   -- ?
  */
  static async getGasPriceWeiForTxType(typename, poolConfig, mongoInterface)
  {
    let gasPriceData = await Web3ApiHelper.getGasPriceData( mongoInterface )

    var averageGasPriceWei = gasPriceData.average

    if(isNaN( averageGasPriceWei )){
      averageGasPriceWei = 100
    }

    var solutionGasPriceWei = parseInt( averageGasPriceWei )



    if( typename == 'solution'  )
    {
        let gasPriceBoost =  parseInt( poolConfig.mintingConfig.gasPriceBoost ) 
        if(!isNaN(gasPriceBoost) && gasPriceBoost > 0){
          solutionGasPriceWei += gasPriceBoost
        }


        let maxGasPrice =  parseInt( poolConfig.mintingConfig.maxGasPriceGwei ) 

        return Math.min( solutionGasPriceWei , maxGasPrice )
    }

    if( typename == 'batched_payment'  )
    {
      let maxGasPrice = parseInt( poolConfig.paymentsConfig.maxGasPriceGwei )

      return Math.min( solutionGasPriceWei , maxGasPrice )
    }

     
       // solutionGasPriceWei = Math.min( averageGasPriceWei , solutionGasPriceWei )
     
    console.log('WARN: calculating gas fee for unknown type: ', typename)
    return solutionGasPriceWei


  } 

  static async getGasPriceData(mongoInterface)
  {
    let priceEstimates =  await mongoInterface.findOne('ethGasPriceWei')

    return  priceEstimates
  }


  static rawAmountToFormatted(amount,decimals)
  {
    return (amount * Math.pow(10,-1 * decimals)).toFixed(decimals);
  }

  static formattedAmountToRaw(amountFormatted,decimals)
  {

    var multiplier = new BigNumber( 10 ).exponentiatedBy( decimals ) ;


    return multiplier.multipliedBy(amountFormatted).toFixed() ;
  }



}
