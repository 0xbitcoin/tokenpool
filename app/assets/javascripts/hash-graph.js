
var Chart = require('chart.js');


export default class HashGraph {



  init()
  {



  }

  update(hashingDataSet)
  {

    //var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var config = {
      type: 'line',
      data: {
        labels:  hashingDataSet.blocks, //blocks   // [ 1000,2000,3000,4000,5000 ],
        datasets: [{
          label: 'Hashrate',

          backgroundColor: 'transparent',
          borderColor: '#ff7209',
          data:    hashingDataSet.points,   //2,4,1,5,1,2,4,2,1,

          fill: false,
        } ]
      },
      options: {
        responsive: true,
        title: {
          display: false,
          text: ' '
        },
        legend: {
          display: false,
            labels: {
              display: false
            }
          },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },
        scales: {
          xAxes: [{
            display: false,
            scaleLabel: {
              display: false,
              labelString: 'Month'
            }
          }],
          yAxes: [{
            display: false,
            scaleLabel: {
              display: false,
              labelString: 'Value'
            }
          }]
        }
      }
    };






      var ctx = document.getElementById('hashgraph').getContext('2d');
      window.myLine = new Chart(ctx, config);


    console.log('building hashrate chart')

  }

}
