
 

var io = require('socket.io-client');

var socket;

export default class SocketHelper{


    initSocket(){

        var current_hostname = window.location.hostname;

        const socketServer = 'http://'+current_hostname+':2052';
  
        const options = {transports: ['websocket'], forceNew: true};
        socket = io(socketServer, options);
  
  
        // Socket events
        socket.on('connect', () => {
          console.log('connected to socket.io server');
        });
  
  
        socket.on('disconnect', () => {
          console.log('disconnected from socket.io server');
        });
   

      
       return socket    

      //  setInterval(this.update.bind(this),5000);
    }


    emitEvent(evt,args){
      
        socket.emit(evt,args); 
       
         
    }
 




}