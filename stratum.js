

var redisInterface = require('./lib/redis-interface')
var stratumServer = require('./lib/stratum-server')

init();

async function init()
{
   await redisInterface.init()
   await stratumServer.init();
}
