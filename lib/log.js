
const fs = require('fs');
var dateFormat = require('dateformat');
const os = require('os');

var logfile = '';

module.exports =  {

   init() {
      logfile = global.logfileFolder + '/logs/stratum.log';
   },

   // log to the console
   LogS() {
      console.log(concat(arguments));
   },

   // log to disk file
   LogD() {
      logToDisk(concat(arguments));
   },


   // log to both console and disk file
   LogB() {
      var logText = concat(arguments);
      console.log(logText);
      logToDisk(logText);
   }

}

function logToDisk(text) {
   fs.appendFile(logfile, text + os.EOL, (err) => {
      if (err) {
         console.log('Error: logToDisk.appendFile failed with error', err);
      }
   });   
}

function concat(arguments) {
   var output = dateFormat("'d'd HH:MM:ss.l> ");
   for (var i = 0; i < arguments.length; i++) {
      output += arguments[i] + ' ';
   }
   return output;
}
