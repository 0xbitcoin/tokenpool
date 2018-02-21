
const $ = require('jquery');
import Vue from 'vue';


var io = require('socket.io-client');


var app;
var dashboardData;

var accountlist;



export default class AccountRenderer {

    async init( )
    {

      this.accountListData = {
        minerAccountData: [ ]
      }

      var self = this;

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


      this.socket.on('minerData', function (data) {
        console.log('got miner data ', JSON.stringify(data));

        data.map(item => item.minerData.tokenBalanceFormatted = (item.minerData.tokenBalance / parseFloat(1e8)  ))
        data.map(item => item.minerData.tokenRewardsFormatted = (item.minerData.tokensAwarded / parseFloat(1e8)  ))


        self.accountListData.minerAccountData = data;

        Vue.set(accountlist.accounts, 'account_list',  data )

      });


       this.findAllMinerData();



       accountlist = new Vue({
          el: '#accountlist',
          data: {
            //parentMessage: 'Parent',
            accounts: {
              account_list: this.accountListData.minerAccountData
            }
          }
        })
    }


    async findAllMinerData(minerEthAddress)
    {
      console.log('request miner data')
      this.socket.emit('getAllMinerData');


    }


     async update( )
    {

      var accountData = await this.findAllMinerData()




    }

    hide()
    {
      $('#accountlist').hide();
    }

    show()
    {
      $('#accountlist').show();
    }

}
