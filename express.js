const express = require('express')
const path = require('path')
const history = require('connect-history-api-fallback')
 
const app = express();

const staticFileMiddleware = express.static(path.join(__dirname))

app.use(staticFileMiddleware)
app.use(history())
app.use(staticFileMiddleware)


const port = 3000;
/*
app.get('/', function (req, res) {
    res.render(path.join(__dirname + '/index.html'))
  })
  
  app.listen(5000, function () {
    console.log( 'Express serving on 5000!' )
  })

*/

app.use(express.static('dist'))
 app.get('/', (req, res) => {
    res.sendFile('./dist/index.html', { root: __dirname });
}); 

app.listen(port, () => console.log(`listening on port ${port}!`));

  