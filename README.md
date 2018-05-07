### Token Mining Pool  

Developed by the 0xBitcoin Community

(GNU PUBLIC LICENSE)

A pool for mining RC20 Tokens


CSS Colors: https://flatuicolors.com/palette/au

1) improve colors
2) more workers  (jsonrpc listeners?)
3) two eth accounts .. xfers and mints
4) separate geth
5) why does it say 'Reply:OK' ??

### BASIC SETUP  (needs Node8)
1. npm install -g node-gyp
1. sudo apt-get install build-essential
2. npm install
3. npm run webpack  #(to build the website files)
4. rename 'sample.account.config.js' to 'account.config.js' and fill it with the pool's ethereum account data

5. install redis-server and make sure it is running
6. Edit pool.config.js to your tastes
7. Edit the website files in /app  to change the look of the website
8. npm run server #(or npm run server test for Ropsten test net)


### CONFIGURING  - set up  account.config.js and pool.config.js

##### pool.config.js

var poolconfig = {
  minimumShareDifficulty: 5000,   //lowest miner share difficulty
  maximumShareDifficulty: 10000    //highest miner share difficulty
  solutionGasPriceWei: 10,   //ether paid by the pool for each mint
  transferGasPriceWei: 6,   //ether paid by the pool for each payment
  poolTokenFee: 5,     //percent of tokens the pool keeps for itself
  communityTokenFee: 2,   //percent of tokens the pool pledges to donate
  minBalanceForTransfer: 1500000000,   
  payoutWalletMinimum: 100000000000,
  allowCustomVardiff: true,
  populationLimit: 100,    //not implemented yet...
  web3provider: "http://127.0.0.1:8545"   //point at Geth or remove to use Infura
}





### HOW TO USE
1. Point a poolminer at your pool using http://localhost:8586  (or ipaddress:8586 or domain.com:8586)  (make sure firewall allows this port)
2. View website interface at http://localhost:3000 (you can set up nginx to serve the static files in /public)


## Installing Redis  
  1. sudo apt-get install redis
  2. sudo service redis-server start

   - Redis will serve/connect at localhost:6379 by default - the pool will use this port

## Redis Commands

LRANGE broadcasted_payments 0 -1




## TODO / BUGS
- Add more clustering/workers and more JSONRPC/socket ports to handle heavy loads
- Make sure good solns ARE BEING TRANFERRED
