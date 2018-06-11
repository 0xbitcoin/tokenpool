  const express = require('express')



      var fs = require('fs');

module.exports =  {



  async init( https_enabled,webInterface,peerInterface   )
  {
      console.log("init web server...")


    this.webInterface=webInterface;
      this.peerInterface=peerInterface;


      const app = express()

      if(https_enabled)
      {
        console.log('using https')

        var config = require('./sslconfig');

        var sslOptions ={
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)/*,
        ca: [
          fs.readFileSync(config.ssl.root, 'utf8'),
          fs.readFileSync(config.ssl.chain, 'utf8')
        ]*/
       }



        var server = require('https').createServer(sslOptions,app);

      }else{
        var server = require('http').createServer(app);

      }



      app.use('/', express.static('public'))

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

      app.listen(3000, () => console.log('Web app listening on port 3000!'))


      this.startSocketServer(server)
  },

  startSocketServer(server )
  {





    var self = this;
    var io = require('socket.io')(server);
    var port = process.env.PORT || 2052;


    ///  https://socket.io/docs/rooms-and-namespaces/#


    server.listen(port, function () {
      console.log('Socket server listening at port %d', port);
    });

    var sockets = {};


    io.on('connection', function (socket) {
      console.log('established new socket connection');


          socket.on('ping', function (data) {
            console.log('ping', data);

              io.emit('pong', {
                  message:'pong'
                });


             });

             socket.on('getAllMinerData', async function (data) {

                 var minerData = await self.peerInterface.getAllMinerData( )

                 socket.emit('minerData',  minerData);

                });



                socket.on('getAllTransactionData', async function (data) {

                   var txData = await self.peerInterface.getAllTransactionData( )

                   socket.emit('transactionData',  txData);

              });

              socket.on('getPoolData', async function (data) {

                  var poolData = await self.peerInterface.getPoolData( )

                  socket.emit('poolData',  poolData);

                 });






          socket.on('getMinerBalancePayments', async function (data) {

              var txData = await self.webInterface.getMinerBalancePayments(data.address, 100 )

              socket.emit('minerBalancePayments',  txData);

          });

          socket.on('getMinerBalanceTransfers', async function (data) {

              var txData = await self.webInterface.getMinerBalanceTransfers(data.address, 100 )

              socket.emit('minerBalanceTransfers',  txData);

          });


          socket.on('getMinerUnsuccessfulBalanceTransfers', async function (data) {

              var txData = await self.webInterface.getMinerUnsuccessfulBalanceTransfers(data.address, 100 )

              socket.emit('minerUnsuccessfulBalanceTransfers',  txData);

          });


          socket.on('getMinerSubmittedShares', async function (data) {

              var txData = await self.webInterface.getMinerSubmittedShares(data.address, 100 )

              socket.emit('minerSubmittedShares',  txData);
          });


          socket.on('getMinerInvalidShares', async function (data) {

              var txData = await self.webInterface.getMinerInvalidShares(data.address, 100 )

              socket.emit('minerInvalidShares',  txData);
          });


              socket.on('getActiveTransactionData', async function (data) {

                  var txData = await self.webInterface.getActiveTransactionData( 100 )

                  socket.emit('activeTransactionData',  txData);

             });

             socket.on('getQueuedTransactionData', async function (data) {

                 var txData = await self.webInterface.getQueuedTransactionData( 100 )

                 socket.emit('queuedTransactionData',  txData);

            });

            socket.on('getPendingBalanceTransfers', async function (data) {

                var txData = await self.webInterface.getPendingBalanceTransfers(   )

                socket.emit('pendingBalanceTransfers',  txData);

           });

            socket.on('getQueuedReplacementPaymentData', async function (data) {

                var txData = await self.webInterface.getQueuedReplacementPaymentData( 100 )

                socket.emit('queuedReplacementPaymentData',  txData);

           });


           socket.on('getUnconfirmedBroadcastedPaymentData', async function (data) {

               var txData = await self.webInterface.getUnconfirmedBroadcastedPaymentData( 100 )

               socket.emit('unconfirmedBroadcastedPaymentData',  txData);

          });

            socket.on('getHashrateData', async function (data) {

                var txData = await self.webInterface.getHashrateData( 100 )

                socket.emit('hashrateData',  txData);

           });




             socket.on('getPoolConfig', async function (data) {

                 var poolData = await self.webInterface.getPoolConfig( )

                 socket.emit('poolConfig',  poolData);

                });

              socket.on('getPoolStats', async function (data) {

                  var data = await self.webInterface.getPoolStats( )

                  socket.emit('poolStats',  data);

                 });

             socket.on('getSubmittedShares', async function (data) {

                 var data = await self.webInterface.getSubmittedShares( 100 )

                 socket.emit('submittedShares',  data);

                });


                socket.on('getSubmittedSolutions', async function (data) {

                    var data = await self.webInterface.getSubmittedSolutions( 100 )

                    socket.emit('submittedSolutions',  data);

                   });

               socket.on('getMinerDetails', async function (data) {

                    var minerData = await self.peerInterface.getMinerData( data.address )

                    socket.emit('minerDetails',  minerData);

                  });





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
