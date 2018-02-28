
const $ = require('jquery');
import Vue from 'vue';


var io = require('socket.io-client');


var app;
var dashboardData;


var txlist;
var jumbotron;

export default class HomeRenderer {

    init( )
    {

      var self = this;

      this.transactionListData = {
        txData: [ ]
      }


      var current_hostname = window.location.hostname;

      const socketServer = 'http://'+current_hostname+':4000';

      const options = {transports: ['websocket'], forceNew: true};
      this.socket = io(socketServer, options);


      // Socket events
      this.socket.on('connect', () => {
        console.log('connected to socket.io server');
      });


      this.socket.on('disconnect', () => {
        console.log('disconnected from socket.io server');
      });


      this.socket.on('activeTransactionData', function (data) {
      //  console.log('got transactionData', JSON.stringify(data));

      //  data.map(item => item.minerData.tokenBalanceFormatted = (item.minerData.tokenBalance / parseFloat(1e8)  ))
      //  data.map(item => item.formattedStatus =  self.getFormattedStatus(item.receiptData) )

        for(var i in data )
        {
          data[i].formattedStatus =  self.getFormattedStatus(data[i].receiptData)
        }

       console.log('got transactionData', JSON.stringify(data));


        Vue.set(txlist.transactions, 'tx_list',  data.slice(0,25) )

      });

      this.socket.on('poolData', function (data) {
        console.log('got poolData ', JSON.stringify(data));


      //  self.accountListData.minerAccountData = data;

        Vue.set(jumbotron.pool, 'poolData',  data )

      });



      txlist = new Vue({
          el: '#txlist',
          data: {
            //parentMessage: 'Parent',
            transactions: {
              tx_list: this.transactionListData.txData
            }
          }
        })


         jumbotron = new Vue({
        el: '#jumbotron',
        data:{
          pool:{
            poolData: { address:'' }
           }
         }
      });

      this.show();

      console.log('Emit to websocket')
       this.socket.emit('getPoolData');
       this.socket.emit('getActiveTransactionData');

    }


    getFormattedStatus(receiptData)
    {
        if(receiptData.success) return 'success';
      if(receiptData.mined) return 'mined';
      if(receiptData.pending) return 'pending';
      if(receiptData.queued) return 'queued';
      return '?'
    }


     update(renderData)
    {

      this.socket.emit('getPoolData');
      this.socket.emit('getActiveTransactionData');


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
