
module.exports =  {


  getUnixTimeNow()
  {
    return Math.round((new Date()).getTime() / 1000);
  },

  getDefaultMinerData(){
    return {
      shareCredits: 0,
      tokenBalance: 0, //what the pool owes
      tokensAwarded:0,
      varDiff: 4000, //default
      validSubmittedSolutionsCount: 0
    }
  }

}
