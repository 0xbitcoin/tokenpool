
const $ = require('jquery');



export default class HomeDashboard {


  init(dashboardRenderer)
  {
    setInterval( function(){


         dashboardRenderer.update();



    },30*1000);


        dashboardRenderer.init();


  }



}
