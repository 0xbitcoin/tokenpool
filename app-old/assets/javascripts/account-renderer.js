
const $ = require('jquery');
import Vue from 'vue';

//var blockies = require('ethereum-blockies')
var io = require('socket.io-client');
var renderUtils = require('./render-utils')


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

      const socketServer = 'http://'+current_hostname+':2052';

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
      //  console.log('got miner data ', JSON.stringify(data));

        var totalShares = 0;

        data.map(item => item.sharesData.hashRateFormatted = renderUtils.formatHashRate(item.sharesData.hashRate   ))
        data.map(item => item.minerData.tokenBalanceFormatted = (item.minerData.tokenBalance / parseFloat(1e8)  ))
        data.map(item => item.minerData.tokenRewardsFormatted = (item.minerData.tokensAwarded / parseFloat(1e8)  ))
          data.map(item =>  (totalShares =  (totalShares + item.sharesData.shareCredits) ) )

          data.map(item => item.sharesData.sharesPercent = (  ((item.sharesData.shareCredits / parseFloat(totalShares)) * 100  ).toFixed(2).toString() + '%')   )
         data.map(item => item.profileURL = ('/profile/?address=' + item.minerAddress.toString().toLowerCase())  )



         data.sort(function(a, b){return b.sharesData.shareCredits - a.sharesData.shareCredits});


        for(var i in data)
        {
          var shares = parseInt(data[i].sharesData.shareCredits)
          console.log(shares)
          if( isNaN(shares) || shares <= 0)
          {
             data.splice(i, 1);
          }


          //still a WIP
        // data[i].identicon = self.getIdenticon( data[i].minerAddress  )


        }

        console.log('got miner data ', JSON.stringify(data));


        self.accountListData.minerAccountData = data;

        Vue.set(accountlist.accounts, 'account_list',  data )

      });


      this.socket.emit('getAllMinerData');



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






     async update( )
    {

    //  var accountData = await this.findAllMinerData()

      this.socket.emit('getAllMinerData');

    }

  /*  getIdenticon(hash)
    {

      var icon = blockies.create({ // All options are optional
          seed: hash, // seed used to generate icon data, default: random
        //  color: '#dfe', // to manually specify the icon color, default: random
      //    bgcolor: '#aaa', // choose a different background color, default: random
          size: 15, // width/height of the icon in blocks, default: 8
          scale: 3, // width/height of each block in pixels, default: 4
      //    spotcolor: '#000' // each pixel has a 13% chance of being of a third color,
          // default: random. Set to -1 to disable it. These "spots" create structures
          // that look like eyes, mouths and noses.
      });


      return this.htmlEntities( icon.toString() );

    }*/

     htmlEntities(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
