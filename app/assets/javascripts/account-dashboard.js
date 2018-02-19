
const $ = require('jquery');



export default class AccountDashboard {


  init(ethHelper,web3,accountRenderer)
  {
    setInterval( function(){
      console.log("updating account data")

      accountRenderer.update();


    },30*1000);

    accountRenderer.init();


  }



}
