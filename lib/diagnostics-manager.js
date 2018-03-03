
/*


  Save certain stats to redis every hour


*/
module.exports =  {



    async init( redisInterface,webInterface,peerInterface )
    {
      var self =this;

      setTimeout(new function(){
        await self.collectStats();
      },60*60*1000)

    },

    async collectStats()
    {
        console.log("Collecting Pool Stats")
        


    }

}
