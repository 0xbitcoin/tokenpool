
var fs = require('fs');

var redisInterface = require('../lib/redis-interface')

console.log("Logging Payments...")


async function init()
{

   await redisInterface.init();

  var paymentLog = {};


  paymentLog.missedPayments = [];


  var balancePaymentKeyList = [];
  var balancePayments = [];


  await new Promise(function (fulfilled,rejected) {

        redisInterface.getRedisClient().keys('*',  function(err, keys){
            keys.forEach( function(key,i){
          //  if(!key.toLowerCase().endsWith('0xf13e2680a930aE3a640188afe0F94aFCeBe7023b'.toLowerCase())) return;
          //  console.log(key);

            console.log('for each key')
            if(key.startsWith("balance_payments")){ // get all of the keys that have balance transfer (blockchain transactions)
              console.log(key);
              balancePaymentKeyList.push(key);
            }

          });

            fulfilled();
        });



    });



    console.log("balancePaymentKeyList",balancePaymentKeyList)

  await new Promise(async function (fulfilled,rejected) {

    balancePaymentKeyList.forEach(async function(key,i){

        console.log(key)
          var balancePayments = await redisInterface.getParsedElementsOfListInRedis(key)

          balancePayments.forEach(function(payment,j){
            balancePayments.push(payment)
            console.log(payment)
          });

      });

      fulfilled()


  });

  console.log('balancePayments',balancePayments)

  paymentLog.missedPayments.push({balancePayments: balancePayments })



  var paymentLogJSON = JSON.stringify(paymentLog);

  fs.writeFile("./logs/payments-log.json", paymentLogJSON, function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });

}


init();
