   

   // ==== server ====

   class IpcServer {

      constructor() {
         this.ipcServer = require('node-ipc')
         this.ipcServer.config.id = 'master';
         this.ipcServer.config.retry = 1500;
         this.ipcServer.config.silent = true;
         this.ipcServer.config.maxConnections=10;

         this.ipcServer.serve();
         this.ipcServer.server.start();
      }

      broadcast(msg, data) {
         this.ipcServer.server.broadcast(msg, data);
      }

   }


   // ==== client ====

   class IpcClient {

      constructor(server) {

         this.ipcClient = require('node-ipc');
         this.ipcClient.config.id   = 'client1';
         this.ipcClient.config.retry= 1500;
         this.ipcClient.config.silent = true;
         this.ipcClient.connectTo(server);
      }

      on(msg, callback) {
         this.ipcClient.of.master.on(msg, callback);
         return this;
      }
   }

   module.exports = {
      IpcServer : IpcServer,
      IpcClient : IpcClient
   }

