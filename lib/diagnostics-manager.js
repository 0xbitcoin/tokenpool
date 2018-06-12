
/*


  Save certain stats to redis every hour


*/

var STAT_COLLECTION_PERIOD = 60*60*1000;

module.exports =  {



    async init( redisInterface,webInterface,peerInterface )
    {


      this.redisInterface = redisInterface;
      this.peerInterface=peerInterface;
      var self = this;

    //  var dropResponse =  await this.redisInterface.dropList('total_pool_hashrate')
    //  console.log('dropResponse',dropResponse)
      setInterval( async function(){
        await self.collectStats();
      },STAT_COLLECTION_PERIOD);

      setTimeout( async function(){
        await self.collectStats();
      },5*1000);


    },

    async collectStats()
    {

       console.log("COLLECT STATS")
        var totalHashrate = await this.peerInterface.getTotalMinerHashrate();

        var blockNum = await this.redisInterface.getEthBlockNumber()

        var stored = await this.redisInterface.pushToRedisList('total_pool_hashrate', JSON.stringify({block: blockNum, hashrate: totalHashrate}))

           console.log("stored",stored)
    }




}
