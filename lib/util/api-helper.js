 
    import Web3Helper from './web3-helper.js'
    import BidPacketUtils from '../../src/js/bidpacket-utils.js'
    
    import FileHelper from './file-helper.js'
    
 import PoolStatsHelper from './pool-stats-helper.js'

 
    export default class APIHelper  {
    
        constructor(   ){
           
           
        }

        //http://localhost:3000/api/v1/somestuff
        static async handleApiRequest(request, poolConfig, mongoInterface){
            console.log('got api request', request.params )

            if(request.params['query'].toLowerCase() == 'overview'){

                //  var poolData = await PoolStatsHelper.getPoolData( poolConfig, mongoInterface )

                let poolStatus = await PoolStatsHelper.getPoolStatus( poolConfig, mongoInterface )
      


                return { poolStatus }
            }

            return 'This is the API'
        }
    
         
    }