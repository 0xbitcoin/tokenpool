  const express = require('express')
module.exports =  {


  async init( https_enabled )
  {



      const app = express()

      if(https_enabled)
      {
        console.log('using https')

        var config = require('./config');

        var sslOptions ={
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)/*,
        ca: [
          fs.readFileSync(config.ssl.root, 'utf8'),
          fs.readFileSync(config.ssl.chain, 'utf8')
        ]*/
       }



        var server = require('https').createServer(sslOptions,app);

      }else{
        var server = require('http').createServer(app);

      }

      app.use('/', express.static('public'))

    //  app.use(express.static('public'))
    //  app.get('/', (req, res) => res.send('Hello World!'))

      app.listen(3000, () => console.log('Example app listening on port 3000!'))

  }




}
