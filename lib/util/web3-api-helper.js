

const https = require('https');

const defipulseApiUri = 'https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key='



//const poolConfig = require('../pool.config').config

export default class Web3ApiHelper  {

  constructor(mongoInterface, poolConfig ){
  
    this.poolConfig=poolConfig;
    this.mongoInterface=mongoInterface;


  } 
  

  //perform this with a robust task runner  - bree  and /tasks folder 

    update(){
    this.fetchAPIData()
    setInterval(this.fetchAPIData.bind(this), 1000*10) //every ten seconds
  } 

  async fetchAPIData(){

    console.log('fetch api data')

    try{

      let get_request_uri = defipulseApiUri.concat(this.poolConfig.apiConfig.defiPulseApiKey )

      let api_response = await new Promise(   (resolve, reject) => {
          https.get(get_request_uri, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
            data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
              resolve( JSON.parse(data) )
            });

            }).on("error", (err) => {
              reject(err)
          });

        })


        //use average gas price
        if(api_response && api_response.fast)
        {
           
        

          let priceEstimates = {
            fast: api_response.fast / 10,
            average: api_response.average / 10,
            safeLow: api_response.safeLow / 10,
            blockNumber: api_response.blockNum,
            safeLowWait: api_response.safeLowWait,
            avgWait: api_response.avgWait,
            fastWait: api_response.fastWait
          }

          await this.mongoInterface.upsertOne('ethGasPriceWei', {},  priceEstimates  )
          //await this.redisInterface.storeRedisData('ethGasPriceWei', JSON.stringify( ethgasPriceWei) )

          console.log('stored gaspriceEstimates', priceEstimates )
        }



    }catch(e){
      console.log(e)
    }

  } 

  /*

  This should adapt   -- ?
  */
  static async getGasPriceWeiForTxType(typename, poolConfig, mongoInterface)
  {
    var averageGasPriceWei = await Web3ApiHelper.getAverageGasPriceWei( mongoInterface )

    var solutionGasPriceWei = 1 //poolConfig.paymentConfig.maxTransferGasPriceWei

    if( typename == 'solution'  )
    {
        solutionGasPriceWei =  poolConfig.mintingConfig.maxSolutionGasPriceWei
    }

    if( typename == 'batched_payment'  )
    {
        solutionGasPriceWei =  poolConfig.paymentsConfig.maxTransferGasPriceWei
    }

    if(!isNaN(averageGasPriceWei)){
        solutionGasPriceWei = Math.min( averageGasPriceWei , solutionGasPriceWei )
    }

    return solutionGasPriceWei


  } 

  static async getAverageGasPriceWei(mongoInterface)
  {
    let priceEstimates =  await mongoInterface.findOne('ethGasPriceWei')

    return  priceEstimates
  }



}
