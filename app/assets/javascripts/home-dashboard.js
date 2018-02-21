
const $ = require('jquery');



export default class HomeDashboard {


  init(ethHelper,web3,dashboardRenderer)
  {
    setInterval( function(){ 


         dashboardRenderer.update();



    },30*1000);


        dashboardRenderer.init();


  }



}
