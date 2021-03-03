const $ = require('jquery');
import Vue from 'vue';
var moment = require('moment');

var io = require('socket.io-client');
var renderUtils = require('./render-utils')

var minerUnsuccessfulBalanceTransfersList;
var minerBalancePaymentsList;
var minerBalanceTransfersList;
var minerSubmittedSharesList;
var minerInvalidSharesList;

var jumbotron;

var minerAddress = null;

export default class ProfileRenderer {


  init( )
  {

    minerAddress = this.getAccountUrlParam();

    if(minerAddress == null) return

    var self = this;

    setInterval( function(){
      console.log("updating profile data")

      self.update();


    },30*1000);


      this.initSockets();

  }


  initSockets()
  {

    var self = this;

    var current_hostname = window.location.hostname;

    const socketServer = 'http://'+current_hostname+':2052';

    const options = {transports: ['websocket'], forceNew: true};
    this.socket = io(socketServer, options);

    this.socket.on('connect', () => {
      console.log('connected to socket.io server');
    });


    this.socket.on('disconnect', () => {
      console.log('disconnected from socket.io server');
    });



    this.socket.on('minerDetails', function (data) {



     data.address = minerAddress;
     data.etherscanURL = ('https://etherscan.io/address/'+minerAddress.toString().toLowerCase());

     data.tokenBalanceFormatted = self.formatTokenQuantity( data.tokenBalance );
     data.tokenAlltimeBalanceFormatted = self.formatTokenQuantity( data.alltimeTokenBalance );
     data.tokenRewardsFormatted = self.formatTokenQuantity( data.tokensAwarded );
     data.hashRateFormatted = renderUtils.formatHashRate( data.hashRate );

     console.log('got miner details')
     console.dir(  data );


     Vue.set(jumbotron.miner, 'minerData',  data )

    });


    this.socket.on('minerBalancePayments', function (data) {


     data.map(item => item.amountToPayFormatted  = self.formatTokenQuantity(item.amountToPay)    )

      data.map( function(item){

           if(item.txHash)
           {
             item.transferTxHash = item.txHash;
             item.etherscanTxURL = ('https://etherscan.io/tx/' + item.txHash.toString())
           }

          return item;
      } )



     console.log('got minerBalancePayments')
     console.dir(  data );




      Vue.set(minerBalancePaymentsList, 'transactions',  {tx_list: data.slice(0,50) }  )

    });

    this.socket.on('minerBalanceTransfers', function (data) {

      data.map(item => item.etherscanTxURL = ('https://etherscan.io/tx/' + item.txHash.toString())  )

      data.map(item => item.tokenAmountFormatted  = self.formatTokenQuantity(item.tokenAmount)    )



      console.log('got minerBalanceTransfers')
      console.dir(  data );

      Vue.set(minerBalanceTransfersList, 'transactions',  {tx_list: data.slice(0,50) }  )

    });

    this.socket.on('minerUnsuccessfulBalanceTransfers', function (data) {

      //data.map(item => item.etherscanTxURL = ('https://etherscan.io/tx/' + item.txHash.toString())  )

      data.map(item => item.tokenAmountFormatted  = self.formatTokenQuantity(item.tokenAmount)    )


      console.log('got minerUnsuccessfulBalanceTransfers')
      console.dir(  data );

      Vue.set(minerUnsuccessfulBalanceTransfersList, 'transactions',  {tx_list: data.slice(0,50) }  )

    });

    this.socket.on('minerSubmittedShares', function (data) {

      console.log('got minerSubmittedShares')
      console.dir(  data );

     data.map(item => item.timeFormatted = self.formatTime(item.time)     )

     data.map(item => item.hashRateFormatted =  renderUtils.formatHashRate(item.hashRateEstimate)    )


      Vue.set(minerSubmittedSharesList, 'shares',  {share_list: data.slice(0,50) }  )

    });

    this.socket.on('minerInvalidShares', function (data) {

      console.log('got minerInvalidShares')
      console.dir(  data );

     data.map(item => item.timeFormatted = self.formatTime(item.time)     )


      Vue.set(minerInvalidSharesList, 'shares',  {share_list: data.slice(0,50) }  )

    });



    jumbotron = new Vue({
         el: '#jumbotron',
         data:{
           miner:{
             minerData: { address: minerAddress , etherscanURL: ('https://etherscan.io/address/'+minerAddress.toString().toLowerCase())},
            }
          }
       });


    minerBalancePaymentsList = new Vue({
        el: '#minerBalancePaymentsList',
        data: {
          transactions: {
            tx_list: []
          }
        }
      })

      minerBalanceTransfersList = new Vue({
          el: '#minerBalanceTransfersList',
          data: {
            transactions: {
              tx_list: []
            }
          }
        })

        minerUnsuccessfulBalanceTransfersList = new Vue({
            el: '#minerUnsuccessfulBalanceTransfersList',
            data: {
              transactions: {
                tx_list: []
              }
            }
          })

        minerSubmittedSharesList = new Vue({
            el: '#minerSubmittedSharesList',
            data: {
              shares: {
                share_list: []
              }
            }
          })

          minerInvalidSharesList = new Vue({
              el: '#minerInvalidSharesList',
              data: {
                shares: {
                  share_list: []
                }
              }
            })

        this.socket.emit('getMinerDetails',{address: minerAddress});

        this.socket.emit('getMinerBalancePayments',{address: minerAddress});
        this.socket.emit('getMinerBalanceTransfers',{address: minerAddress});
        this.socket.emit('getMinerUnsuccessfulBalanceTransfers',{address: minerAddress});
        this.socket.emit('getMinerSubmittedShares',{address: minerAddress});
        this.socket.emit('getMinerInvalidShares',{address: minerAddress});



  }

  getAccountUrlParam()
  {

    let url = new URL(window.location.href);
    let searchParams = new URLSearchParams(url.search);
    console.log('address in url ', searchParams.get('address'));


    return searchParams.get('address');
  }

  update(){

            this.socket.emit('getMinerDetails',{address: minerAddress});

            this.socket.emit('getMinerBalancePayments',{address: minerAddress});
            this.socket.emit('getMinerBalanceTransfers',{address: minerAddress});
            this.socket.emit('getMinerUnsuccessfulBalanceTransfers',{address: minerAddress});
            this.socket.emit('getMinerSubmittedShares',{address: minerAddress});
            this.socket.emit('getMinerInvalidShares',{address: minerAddress});

  }

  formatTime(time)
  {
    if(time == null || time == 0)
    {
      return "--";
    }

    return moment.unix(time).format('MM/DD HH:mm');
  }

  formatTokenQuantity(satoshis)
  {
    return (parseFloat(satoshis) / parseFloat(1e8)).toString();
  }


/*
  let url = new URL('http://www.test.com/t.html?a=1&b=3&c=m2-m3-m4-m5');
  let searchParams = new URLSearchParams(url.search);
  console.log(searchParams.get('c'));

*/


}
