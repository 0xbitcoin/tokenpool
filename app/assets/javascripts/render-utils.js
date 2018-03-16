const $ = require('jquery');

var moment = require('moment');


module.exports={

  formatTokenQuantity(satoshis)
  {
    return (parseFloat(satoshis) / parseFloat(1e8)).toString();
  }


/*
  let url = new URL('http://www.test.com/t.html?a=1&b=3&c=m2-m3-m4-m5');
  let searchParams = new URLSearchParams(url.search);
  console.log(searchParams.get('c'));

*/


}
