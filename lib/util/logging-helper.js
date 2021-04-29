
const MAX_LOGS = 1000;
import PeerHelper from './peer-helper.js'

export default class LoggingHelper {


/*
    async init( poolConfig, mongoInterface )
    {
 
      this.mongoInterface = mongoInterface;
      this.poolConfig = poolConfig 
      
    } 
*/

    static async appendLog(message, typeCode,   mongoInterface ){

        if(typeof message != 'string'){
            message = JSON.stringify ( message ) 
        }

        let newLogData = {
            message: message,
            typeCode: typeCode
        } 

        newLogData.createdAt = PeerHelper.getTimeNowUnix()

        await mongoInterface.insertOne('logs', newLogData )



    }


    static async deleteOldLogs( mongoInterface ){

        let unixTime = PeerHelper.getTimeNowUnix()

        const ONE_HOUR = 1*60*60*1000;  

        await mongoInterface.deleteMany('logs', { createdAt: {$lt: (unixTime - ONE_HOUR)   } } )
    }



}

 
LoggingHelper.TYPECODES={
    GENERIC:0,
    ERROR:1,
    WARN:2,
    SHARES:3,
    TRANSACTIONS:4

};
