
const $ = require('jquery');
import Vue from 'vue';

var app;
var dashboardData;

export default class DashboardRenderer {

    init(renderData)
    {

      console.log('rd1',renderData)
      dashboardData = renderData;

         app = new Vue({
        el: '#dashboard',
        data: dashboardData
      });

      this.show();

    }

     update(renderData)
    {
      console.log('rd2',renderData)
      dashboardData = renderData;

      //  app.data =   renderData;

        //vm.$forceUpdate();

        this.show();
    }

    hide()
    {
      $('#dashboard').hide();
    }

    show()
    {
      $('#dashboard').show();
    }

}
