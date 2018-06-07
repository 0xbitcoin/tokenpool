
const $ = require('jquery');
import Vue from 'vue';

var web3utils = require('web3-utils')


var io = require('socket.io-client');

import HashGraph from './hash-graph'

var hashGraph = new HashGraph();

var app;
var dashboardData;


var solutiontxlist;
var transfertxlist;
var jumbotron;
var poolStats;

var performerList;

export default class HomeRenderer {

    init( )
    {

      var self = this;

      this.transactionListData = {
        txData: [ ]
      }


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


      this.socket.on('activeTransactionData', function (data) {
      //  console.log('got transactionData', JSON.stringify(data));

      var solution_list = [];
      var transfer_list = [];

          data.sort(function(a, b) {
              return b.block - a.block;
            });

        for(var i in data )
        {
          var formattedStatus =  self.getFormattedStatus(data[i].receiptData)
          data[i].formattedStatus = formattedStatus;

          if(formattedStatus == '?'){formattedStatus = 'unknown'}
          data[i].htmlClass = "tx-row status-"+ formattedStatus;

          if(data[i].txHash){
            data[i].txURL = ("https://etherscan.io/tx/"+ data[i].txHash.toString());
          }


          if(data[i].receiptData.pending == false)
          {
            if( data[i].txType=='solution'  )
            {
              solution_list.push( data[i] )
            }
            if( data[i].txType=='transfer'  )
            {
              transfer_list.push( data[i] )
            }
          }



        }

      // console.log('got transactionData', JSON.stringify(data));



       Vue.set(solutiontxlist.transactions, 'tx_list',  solution_list.slice(0,25) )
       Vue.set(transfertxlist.transactions, 'tx_list',  transfer_list.slice(0,25) )

      });





      this.socket.on('minerData', function (data) {
        console.log('got miner data ', JSON.stringify(data));

        var totalShares = 0;

        data.map(item => item.minerData.hashRateFormatted = renderUtils.formatHashRate(item.minerData.hashRate   ))
        data.map(item => item.minerData.tokenBalanceFormatted = (item.minerData.tokenBalance / parseFloat(1e8)  ))
        data.map(item => item.minerData.tokenRewardsFormatted = (item.minerData.tokensAwarded / parseFloat(1e8)  ))
          data.map(item =>  (totalShares =  (totalShares + item.minerData.shareCredits) ) )

          data.map(item => item.minerData.sharesPercent = (  ((item.minerData.shareCredits / parseFloat(totalShares)) * 100  ).toFixed(2).toString() + '%')   )
         data.map(item => item.profileURL = ('/profile/?address=' + item.minerAddress.toString())  )



         data.sort(function(a, b){return b.minerData.shareCredits - a.minerData.shareCredits});


        for(var i in data)
        {
          var shares = parseInt(data[i].minerData.shareCredits)
          console.log(shares)
          if( isNaN(shares) || shares <= 0)
          {
             data.splice(i, 1);
          }


          //still a WIP
        // data[i].identicon = self.getIdenticon( data[i].minerAddress  )


        }


        self.accountListData.minerAccountData = data;

        Vue.set(accountlist.accounts, 'account_list',  data )

      });




      this.socket.on('poolData', function (data) {

        data.etherscanMintingURL = "https://etherscan.io/address/"+data.mintingAddress.toString();
        data.etherscanPaymentURL = "https://etherscan.io/address/"+data.paymentAddress.toString();


          Vue.set(jumbotron.pool, 'poolData',  data )

      });


      this.socket.on('hashrateData',   function (data) {

        var labels = [];
        var blocks = [];
        var hashRates = [];

        data.reverse().slice(0,100).map(function(item){
          labels.push('Block '+ item.block.toString()),
          blocks.push(item.block),
          hashRates.push(item.hashrate)
        })

        var hashingDataSet = {blocks: blocks, points: hashRates, labels:labels};

        console.log('got hashratedata ', hashingDataSet );

        hashGraph.update(hashingDataSet)


      });

      this.socket.on('poolStats', function (data) {
        console.log('got poolStats ',  data );


        //data.formattedTotalPoolFeeTokens=  self.formatTokenQuantity( data.totalPoolFeeTokens );
        //data.formattedTotalCommunityFeeTokens= self.formatTokenQuantity( data.totalCommunityFeeTokens );

        Vue.set(poolStats.pool, 'poolStats',  data )
      });



      solutiontxlist = new Vue({
          el: '#solutiontxlist',
          data: {
            //parentMessage: 'Parent',
            transactions: {
              tx_list: this.transactionListData.txData
            }
          }
        })

       transfertxlist = new Vue({
            el: '#transfertxlist',
            data: {
              //parentMessage: 'Parent',
              transactions: {
                tx_list: this.transactionListData.txData
              }
            }
          })



     performerList = new Vue({
        el: '#topPerformers',
        data: {
          //parentMessage: 'Parent',
          performers: {
            list: []
          }
        }
      })

         jumbotron = new Vue({
        el: '#jumbotron',
        data:{
          pool:{
            poolData: {   },
            etherscanContractURL: {}
           }
         }
      });

      poolStats = new Vue({
         el: '#poolstats',
         data:{
           pool:{
             poolStats: { }
            }
          }
       });

      var hashingDataSet= {
        labels: [5555,5556,5557],
        points: [0,0,0]
      }

      hashGraph.init()





      $('.mining-instructions-container').hide();

      $('.toggle-mining-instructions').on('click',function(){
          $('.mining-instructions-container').toggle();
      });


      $('#mining-account-input').on('keypress', function (e) {
         if(e.which === 13){


            //Disable textbox to prevent multiple submit
            $(this).attr("disabled", "disabled");

            var address = $('#mining-account-input').val();

             console.log('submit the thing ', address)

             if( web3utils.isAddress(address) )
             {
               window.location.href = '/profile?address='+address;
             }else{
               console.error("Please provide a valid address")
             }

            //Enable the textbox again if needed.
            $(this).removeAttr("disabled");
         }
   });


      this.show();

      console.log('Emit to websocket')
       this.socket.emit('getPoolData');
       this.socket.emit('getPoolStats');
       this.socket.emit('getHashrateData');
       this.socket.emit('getActiveTransactionData');
       this.socket.emit('getTopMinerData');

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
      this.socket.emit('getPoolStats');
      this.socket.emit('getHashrateData');
      this.socket.emit('getActiveTransactionData');
      this.socket.emit('getTopMinerData');


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
