
const $ = require('jquery');



export default class OverviewDashboard {


  init(overviewRenderer)
  {
    setInterval( function(){


         overviewRenderer.update();



    },30*1000);


        overviewRenderer.init();


  }



}
