
const $ = require('jquery');



export default class ProfileRenderer {

var minerAddress = null;

  init( )
  {
    setInterval( function(){
      console.log("updating profile data")

      this.update();


    },30*1000);

  //  this.start();

    this.initSockets();

    minerAddress = this.getAccountUrlParam();

  }


  initSockets()
  {

  }

  getAccountUrlParam()
  {

    let url = new URL(window.location.href);
    let searchParams = new URLSearchParams(url.search);
    console.log('address in url ', searchParams.get('address'));


    return searchParams.get('address');
  }



/*
  let url = new URL('http://www.test.com/t.html?a=1&b=3&c=m2-m3-m4-m5');
  let searchParams = new URLSearchParams(url.search);
  console.log(searchParams.get('c'));

*/


}
