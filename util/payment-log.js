
var fs = require('fs');

console.log("Logging Payments...")



var paymentLog = {};


paymentLog.missedPayments = [];


paymentLog.missedPayments.push({title:"Hello"})



var paymentLogJSON = JSON.stringify(paymentLog);

fs.writeFile("./logs/payments-log.json", paymentLogJSON, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});
