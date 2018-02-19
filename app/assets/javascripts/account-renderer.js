
const $ = require('jquery');
import Vue from 'vue';


var io = require('socket.io-client');


var app;
var dashboardData;

export default class AccountRenderer {

    async init( )
    {

      const socketServer = 'http://'+API.serverIP+':4000';

      const options = {transports: ['websocket'], forceNew: true};
      this.socket = io(socketServer, options);


      // Socket events
      this.socket.on('connect', () => {
        console.log('connected to socket.io server');
      });


      this.socket.on('disconnect', () => {
        console.log('disconnected from socket.io server');
      });


      this.socket.on('pong', function (data) {
        console.log('heard pong', JSON.stringify(data));

      });


      var accountData = await findMinerData(null)

      console.log('accountData',accountData )
    }


    async findMinerData(minerEthAddress)
    {
      this.socket.emit('ping', minerEthAddress);


    }




     update( )
    {
      console.log('rd2',renderData)
      dashboardData = renderData;

      //  app.data =   renderData;

        //vm.$forceUpdate();

        this.show();
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
