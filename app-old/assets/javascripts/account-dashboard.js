
const $ = require('jquery');



export default class AccountDashboard {


  init(accountRenderer)
  {
    setInterval( function(){
      console.log("updating account data")

      accountRenderer.update();


    },30*1000);

    accountRenderer.init();


  }



}
