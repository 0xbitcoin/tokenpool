   
   var os = require('os');
   var ipc = require('node-ipc')

   ipc.config.id   = 'master';
   ipc.config.retry = 1500;
   ipc.config.silent = true;
   ipc.config.maxConnections=10;

   (function init(){

      // need a special case for my dev environment
      if (os.hostname() == 'desktop-pc') {
       ipc.myServe = ipc.serveNet;
      }
      else {
       ipc.myServe = ipc.serve;
      }

      ipc.myServe();
      ipc.server.start();

   })();

   exports.server = ipc.server;
