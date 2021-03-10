  
  
  
  import express from 'express'
   

import fs from 'fs'
 import path from 'path'
 
 import PeerHelper from './util/peer-helper.js'
 import PoolStatsHelper from './util/pool-stats-helper.js'
 import Web3ApiHelper from './util/web3-api-helper.js'
 import TransactionHelper from './util/transaction-helper.js'

 import https from 'https'
 import http from 'http'
 
 import {Server}  from 'socket.io'

export default class WebServer  {


  //https_enabled,webInterface,peerInterface,web3apihelper 
  async init( https_enabled, poolConfig, mongoInterface   )
  {
      console.log("init web server...")

      this.mongoInterface=mongoInterface;
      this.poolConfig=poolConfig;
      //this.webInterface=webInterface;
      //this.peerInterface=peerInterface;

      //this.web3apihelper=web3apihelper;


            const app = express()



         

      if(https_enabled)
      {
        console.log('using https')

        var config = fs.readFileSync(path.resolve()+'/sslconfig.json');//   require('./sslconfig');

        var sslOptions ={
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)/*,
        ca: [
          fs.readFileSync(config.ssl.root, 'utf8'),
          fs.readFileSync(config.ssl.chain, 'utf8')
        ]*/
       }



        var server = https.createServer(sslOptions,app);

      }else{
        var server = http.createServer(app);

      }



     // app.use('/', express.static('dist'))

  

      //  app.use(express.static('dist'))

       /* app.get('/', (req, res) => {
            res.sendFile('../dist/index.html', { root: __dirname });
        }); 

        app.get('/overview', (req, res) => {
          res.sendFile('../dist/overview.html', { root: __dirname });
      }); */
        
  



    /*  app.get('/profile/:address',function(req,res)
          {
              var address = null;

              if(req.params.address)
              {
                address = req.params.address;
              }

              res.sendFile('index.html', {root: './public/profile'});
          });*/





    /*  app.use('/profile/:address',

          express.static('public/profile')
        )*/

    //  app.use(express.static('public'))
    //  app.get('/', (req, res) => res.send('Hello World!'))

   //    app.listen(3000, () => console.log('Web app listening on port 3000!'))

   /*   app.get('/', function (req, res) {
        let fullpath = path.join(__dirname + '/dist/index.html')
        console.log('fullpath',fullpath)
        res.render(fullpath)
      })

      app.listen(3000, function () {
        console.log( 'Express serving on 3000!' )
      })*/

      this.startSocketServer(server)
  } 

  startSocketServer(server )
  {

 

 
 
    var io = new Server(server);
    var port = process.env.PORT || 2052;


    ///  https://socket.io/docs/rooms-and-namespaces/#


    server.listen(port, function () {
      console.log('Socket server listening at port %d', port);
    });

    var sockets = {};

    var mongoInterface = this.mongoInterface
    var poolConfig = this.poolConfig


    io.on('connection', function (socket) {
      console.log('established new socket connection');


          socket.on('ping', function (data) {
            console.log('ping', data);

              io.emit('pong', {
                  message:'pong'
                });


             });



             socket.on('getPoolData', async function (data) {

              var poolData = await PoolStatsHelper.getPoolData( poolConfig, mongoInterface )

              socket.emit('poolData',  poolData);

              
             });


             socket.on('getPoolStatus', async function (data) { 
              
              let poolStatus = await PoolStatsHelper.getPoolStatus( poolConfig, mongoInterface )
      
              socket.emit('poolStatus',  poolStatus);


             });




             socket.on('getRecentSolutions', async function (data) {

              let query = {txType:'solution'}

              var txData = await TransactionHelper.findRecentTransactionsWithQuery(query,  mongoInterface )

              socket.emit('recentSolutions',  txData);


             });


             socket.on('getRecentPayments', async function (data) {

              let query = {txType:'batched_payment'}

              var txData = await TransactionHelper.findRecentTransactionsWithQuery(query,  mongoInterface )

              socket.emit('recentPayments',  txData);


             });


             socket.on('getMinerData', async function (data) {

               
              var result = await PeerHelper.getMinerData(data.ethMinerAddress,  mongoInterface )

              socket.emit('minerData',  result);


             });

             socket.on('getMinerShares', async function (data) {

               
              var result = await PeerHelper.getMinerShares(data.ethMinerAddress,  mongoInterface )

              socket.emit('minerShares',  result);


             });
             socket.on('getMinerPayments', async function (data) {
 

              var txData = await PeerHelper.getMinerBalancePayments(data.ethMinerAddress,  mongoInterface )

              socket.emit('minerPayments',  txData);


             });

             socket.on('getMinerList', async function (data) {

             
              var result = await PeerHelper.getMinerList(   mongoInterface )
            
              socket.emit('minerList',  result);


             });



            
            ///------------




            /* socket.on('getAllMinerData', async function (data) {

                 var minerData = await PoolStatsHelper.getAllMinerData( mongoInterface )

                 socket.emit('minerData',  minerData);

                });



                socket.on('getAllTransactionData', async function (data) {

                   var txData = await PoolStatsHelper.getAllTransactionData( mongoInterface )

                   socket.emit('transactionData',  txData);

              });

            





          socket.on('getMinerBalancePayments', async function (data) {

              var txData = await PoolStatsHelper.getMinerBalancePayments(data.address, 100 )

              socket.emit('minerBalancePayments',  txData);

          });

          socket.on('getMinerBalanceTransfers', async function (data) {

              var txData = await PoolStatsHelper.getMinerBalanceTransfers(data.address, 100 )

              socket.emit('minerBalanceTransfers',  txData);

          });


          socket.on('getMinerUnsuccessfulBalanceTransfers', async function (data) {

              var txData = await PoolStatsHelper.getMinerUnsuccessfulBalanceTransfers(data.address, 100 )

              socket.emit('minerUnsuccessfulBalanceTransfers',  txData);

          });


          socket.on('getMinerSubmittedShares', async function (data) {

              var txData = await PoolStatsHelper.getMinerSubmittedShares(data.address, 100 )

              socket.emit('minerSubmittedShares',  txData);
          });


          socket.on('getMinerInvalidShares', async function (data) {

              var txData = await PoolStatsHelper.getMinerInvalidShares(data.address, 100 )

              socket.emit('minerInvalidShares',  txData);
          });


              socket.on('getActiveTransactionData', async function (data) {

                  var txData = await PoolStatsHelper.getActiveTransactionData( 100 )

                  socket.emit('activeTransactionData',  txData);

             });

             socket.on('getQueuedTransactionData', async function (data) {

                 var txData = await PoolStatsHelper.getQueuedTransactionData( 100 )

                 socket.emit('queuedTransactionData',  txData);

            });

            socket.on('getPendingBalanceTransfers', async function (data) {

                var txData = await PoolStatsHelper.getPendingBalanceTransfers(   )

                socket.emit('pendingBalanceTransfers',  txData);

           });

            socket.on('getQueuedReplacementPaymentData', async function (data) {

                var txData = await PoolStatsHelper.getQueuedReplacementPaymentData( 100 )

                socket.emit('queuedReplacementPaymentData',  txData);

           });


           socket.on('getUnconfirmedBroadcastedPaymentData', async function (data) {

               var txData = await PoolStatsHelper.getUnconfirmedBroadcastedPaymentData( 100 )

               socket.emit('unconfirmedBroadcastedPaymentData',  txData);

          });

            socket.on('getHashrateData', async function (data) {

                var txData = await PoolStatsHelper.getHashrateData( 100 )

                socket.emit('hashrateData',  txData);

           });




             socket.on('getPoolConfig', async function (data) {

                 var poolData = await PoolStatsHelper.getPoolConfig( )

                 poolData.poolConfig.solutionGasPriceWei = await Web3ApiHelper.getGasPriceWeiForTxType('solution')
                 poolData.poolConfig.transferGasPriceWei = await Web3ApiHelper.getGasPriceWeiForTxType('payment')


                 socket.emit('poolConfig',  poolData);

                });

              socket.on('getPoolStats', async function (data) {

                  var data = await PoolStatsHelper.getPoolStats( )

                  socket.emit('poolStats',  data);

                 });

             socket.on('getSubmittedShares', async function (data) {

                 var data = await PoolStatsHelper.getSubmittedShares( 100 )

                 socket.emit('submittedShares',  data);

                });


                socket.on('getSubmittedSolutions', async function (data) {

                    var data = await PoolStatsHelper.getSubmittedSolutions( 100 )

                    socket.emit('submittedSolutions',  data);

                   });

               socket.on('getMinerDetails', async function (data) {

                    var minerData = await PoolStatsHelper.getMinerData( data.address )

                    var sharesData = await PoolStatsHelper.getSharesData( data.address )

                    var allMinerData = minerData;

                    allMinerData.shareCredits = sharesData.shareCredits
                    allMinerData.miningDifficulty = sharesData.miningDifficulty
                    allMinerData.validSubmittedSolutionsCount = sharesData.validSubmittedSolutionsCount
                    allMinerData.hashRate = sharesData.hashRate




                    socket.emit('minerDetails',  allMinerData);

                  });


          */




      /*
      socket.on('new message', function (data) {
        console.log('new message', data);

          io.to('chatroom'+data.chatRoomId).emit('new message', {
            chatRoomId: data.chatRoomId,
            senderAddress: data.senderAddress,
            body: data.body,
            owner_name: data.owner_name,
            messageTimeFormatted: data.messageTimeFormatted
          });*/


        //  saveMessage(data.chatRoomId, data.senderAddress, data.message);  //to database using sidekiq -> rails
      //});

      socket.on('disconnect', function () {
        console.log(socket.sid, 'disconnected');
        delete sockets[socket.sid];
      });
    });



  }




}
