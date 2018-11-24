

module.exports =  {

  async init(  )
  {


  },


    async collectPunkDataFromAPI( )
    {
      //put into redis .. every so often


    },

  async getFirstPunkIdForAddress(address)
  {
    //get from redis !!  and  thats from a scrape  of api
    return 1164

  },


   getImageUrlForPunkId(punkId)
  {
    if(punkId > 999)
    {
      var punkNumber = punkId.toString()
    }else {
      var punkNumber = leftpad(punkId.toString(),4)
    }

    return ('http://api.0xbtc.io/img/punk' + punkNumber + '.png')
  },


    leftpad(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
}


}
