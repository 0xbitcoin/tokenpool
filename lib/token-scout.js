

const PunkIcons = require('cryptopunk-icons')
module.exports =  {

  async init(  )
  {
    console.log('mee punk')

    var punk = PunkIcons.getCryptopunkIconLocalImagePath(1152)

      console.log(punk)

  }

}
