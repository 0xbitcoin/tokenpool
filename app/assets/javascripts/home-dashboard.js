
const $ = require('jquery');



export default class HomeDashboard {


  init(homeRenderer)
  {
    setInterval( function(){


         homeRenderer.update();



    },30*1000);


        homeRenderer.init();


  }



}
