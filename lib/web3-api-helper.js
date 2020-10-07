

const https = require('https');

const defipulseApiUri = 'https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key='



const poolConfig = require('../pool.config').config

module.exports =  {

  init(redisInterface,  poolEnv){
    this.pool_env=poolEnv;
    this.poolConfig=poolConfig;
    this.redisInterface=redisInterface;

    this.fetchAPIData()
    setInterval(this.fetchAPIData, 1000*60*60) //every hour
  },

  async fetchAPIData(){

    try{

      let get_request_uri = defipulseApiUri.concat(poolConfig.defiPulseApiKey )

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
        if(api_response && api_response.average)
        {
          let ethgasPriceWei = api_response.average / 10;


          await this.redisInterface.storeRedisData('ethGasPriceWei', JSON.stringify( ethgasPriceWei) )

          console.log('stored ethGasPriceWei', ethgasPriceWei )
        }



    }catch(e){
      console.log(e)
    }

  }


}
