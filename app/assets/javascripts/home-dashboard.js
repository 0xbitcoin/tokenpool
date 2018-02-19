
const $ = require('jquery');



export default class HomeDashboard {


  init(ethHelper,web3,dashboardRenderer)
  {
    setInterval( function(){
      console.log("updating contract data")

       ethHelper.connectToContract( web3 , dashboardRenderer, function(contractData){

         dashboardRenderer.update(contractData);

       } );



    },30*1000);

      ethHelper.connectToContract( web3 , dashboardRenderer, function(contractData){

        dashboardRenderer.init(contractData);

      } );
  }



}
