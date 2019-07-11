
var fs = require('fs');

var redisInterface = require('../lib/redis-interface')

console.log("Logging Payments...")


async function init()
{

   await redisInterface.init();

  var paymentLog = {};


  paymentLog.payments = [];


  var balancePaymentKeyList = [];
  var balancePayments = [];


    var balanceTransferKeyList = [];
    var balanceTransfers = [];
    var balanceTransfersTable = {};

    var owedPayments = {};

  await new Promise(function (fulfilled,rejected) {

        redisInterface.getRedisClient().keys('*',  function(err, keys){
            keys.forEach( function(key,i){
          //  if(!key.toLowerCase().endsWith('0xf13e2680a930aE3a640188afe0F94aFCeBe7023b'.toLowerCase())) return;
          //  console.log(key);


            if(key.startsWith("balance_payments")){ // get all of the keys that have balance transfer (blockchain transactions)

              balancePaymentKeyList.push(key);
            }

          });

            fulfilled();
        });



    });



    console.log("balancePaymentKeyList",balancePaymentKeyList)

  await new Promise(async function (fulfilled,rejected) {

    await asyncForEach(balancePaymentKeyList,async function(key,i){

        console.log('key',key)
          var balancePaymentList = await redisInterface.getParsedElementsOfListInRedis(key)


          console.log('length',balancePaymentList.length)
          for(var j=0;j<balancePaymentList.length;j++ )
          {
            var payment = balancePaymentList[j]
            balancePayments.push(payment)
          //  console.log(j);
          }


      });

      fulfilled()


  });




  await new Promise(function (fulfilled,rejected) {

        redisInterface.getRedisClient().keys('*',  function(err, keys){
            keys.forEach( function(key,i){
          //  if(!key.toLowerCase().endsWith('0xf13e2680a930aE3a640188afe0F94aFCeBe7023b'.toLowerCase())) return;
          //  console.log(key);


            if(key.startsWith("balance_transfers")){ // get all of the keys that have balance transfer (blockchain transactions)

              balanceTransferKeyList.push(key);
            }

          });

            fulfilled();
        });



    });



    console.log("balanceTransferKeyList",balanceTransferKeyList)

  await new Promise(async function (fulfilled,rejected) {

    await asyncForEach(balanceTransferKeyList,async function(key,i){

        console.log('key',key)
          var balanceTransferList = await redisInterface.getParsedElementsOfListInRedis(key)


          console.log('length',balanceTransferList.length)
          for(var j=0;j<balanceTransferList.length;j++ )
          {
            var transfer = balanceTransferList[j]
            balanceTransfers.push(transfer)
            console.log(transfer)
            balanceTransfersTable[transfer.balancePaymentId] = transfer


          //  console.log(j);
          }


      });

      fulfilled()


  });



var missingTransfers = [];

var OWED_PAYMENT_BLOCK_CUTOFF = 5341507;

  for(var i=0;i<balancePayments.length;i++)
   {
     var balancePayment = balancePayments[i];

    // console.log(balancePayment)

     var paymentHash = balancePayment.id;

     //console.log(paymentHash)

     var transfer = balanceTransfersTable[paymentHash];

     if(transfer==null && balancePayment.block < OWED_PAYMENT_BLOCK_CUTOFF)
     {

       console.log(balancePayment)

       if(owedPayments[balancePayment.minerAddress] == null){owedPayments[balancePayment.minerAddress]=0}
       owedPayments[balancePayment.minerAddress] += balancePayment.amountToPay;
       missingTransfers.push(balancePayment)
      //  console.log('missing transfer')
     }



   }



    console.log('balancePaymentss',balancePayments.length)
    console.log('balanceTransferss',balanceTransfers.length)
    console.log('missingTransfers',missingTransfers.length)
//    console.log('owedPayments',owedPayments.keys.length)

  paymentLog.payments.push({
    balancePayments: balancePayments,
    balanceTransfers: balanceTransfers,
    missingTransfers: missingTransfers,
    owedPayments: owedPayments
   })



  var paymentLogJSON = JSON.stringify(paymentLog);

  fs.writeFile("./logs/payments-log.json", paymentLogJSON, function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });

}


init();


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
