  const express = require('express')



      var fs = require('fs');

module.exports =  {


  async init( https_enabled, peerInterface )
  {

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

    //  app.use(express.static('public'))
    //  app.get('/', (req, res) => res.send('Hello World!'))

      app.listen(3000, () => console.log('Web app listening on port 3000!'))


      this.startSocketServer(server)
  },

  startSocketServer(server )
  {



  /*  var express = require('express');
    var app = express();

    if(https_enabled)
    {
      console.log('using https')

      var config = require('./config');

      var sslOptions ={
      key: fs.readFileSync(config.ssl.key),
      cert: fs.readFileSync(config.ssl.cert)/*,
      ca: [
        fs.readFileSync(config.ssl.root, 'utf8'),
        fs.readFileSync(config.ssl.chain, 'utf8')
      ]
     }



      var server = require('https').createServer(sslOptions,app);

    }else{
      var server = require('http').createServer(app);

    }*/



    var io = require('socket.io')(server);
    var port = process.env.PORT || 4000;

    /*
    var redis = require('redis');
    var Sidekiq = require('sidekiq');
    var redisClient = redis.createClient('/tmp/redis.sock');
    var sidekiq = new Sidekiq(redisClient);
    */

    ///  https://socket.io/docs/rooms-and-namespaces/#


    server.listen(port, function () {
      console.log('Socket server listening at port %d', port);
    });

    var sockets = {};




    io.on('connection', function (socket) {
      console.log('connection');



          socket.on('ping', function (data) {
            console.log('ping', data);

              io.emit('pong', {
                  message:'pong'
                });


             });

             socket.on('getMinerData', function (data) {

                var minerEthAddress = null;
                 var minerData = this.peerInterface.getMinerData(minerEthAddress)

                 io.emit('minerData', {
                     minerData: minerData
                   });


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
