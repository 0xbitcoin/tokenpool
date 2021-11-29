### Token Mining Pool  

Developed by InfernalToast with help from the 0xBitcoin Community

(GNU PUBLIC LICENSE)

A pool for mining EIP918 Tokens

See me running at http://tokenminingpool.com


Windows GPU Miner 1
https://bitbucket.org/LieutenantTofu/cosmic-v3/downloads/COSMiC-v4.1.1-MultiGPU-TMP.zip

Windows GPU Miner 2
 https://github.com/mining-visualizer/MVis-tokenminer/releases

 Windows GPU Miner 3
 https://github.com/lwYeo/SoliditySHA3MinerUI/releases/tag/1.0.2

 Linux GPU Miner
 https://github.com/lwYeo/SoliditySHA3Miner/releases





#### Update 1.6.0 

Added support for EIP1559 (thank you RedManStan for assistance) via new pool.config variables (see sample.pool.config.json)
 
 `
 transactionType - Set to '0x02' for eip1559 style or leave null for legacy 
 gasPriorityFeeGwei - If using type 0x02, use this to specify the miner tip 
 `
 


### BASIC SETUP  (needs Node 14) [nvm install 14]
 
1. npm install

2. rename 'sample.pool.config.json' to 'pool.config.json' and fill it with the pool's ethereum account data (make two new accounts, one for minting one for payments and fill both with a small amount of ETH)

3. Install mongodb, make sure it is running as a service

4. 'npm run build'  #(to build the website files)

5. 'npm run pool' #(or 'npm run pool staging 'for staging test mode)
 



### CONFIGURING  - set up  pool.config.json

##### pool.config.json

 


### Test running tasks 
node -r esm  --experimental-worker collectTokenParameters.js 



## Deploying Contracts
You no longer need to deploy contracts 


## HOW TO TEST
1. Point a EIP918 tokenminer (https://github.com/0xbitcoin/0xbitcoin-miner) at your pool using http://localhost:8080   (make sure firewall allows this port)
2. Start the server with 'npm run build' and 'npm run server staging' to put it into staging test mode
3. View website interface at http://localhost:3000 (Feel free to set up nginx/apache to serve the static files in /dist)

You should see that the miner is able to successfully submit shares to the pool when the share difficulty is set to a low value such as 100 and the pool is in 'staging mode'.  Then you can run the pool on mainnet using 'npm run server'.


## Installing MongoDB

Digitalocean guide:
https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04#step-3-%E2%80%94-adjusting-the-firewall-(optional)

 - Mongo is used to store data related to miner shares, balances, and payments

 (WSL: sudo mongod --dbpath ~/data/db)



## DEV TODO  
1. Remove console logging and replace it with socket emissions -> show on a html frontend feed, sort by log type 
 
 * allow for worker name (append to end of address)
 
2. fix hashrate chart 

3. add stratum https://mvis.ca/stratum-spec.html

6. *** Make sure that if a mint() gets stuck that it is cleared out !! Like  if it stuck 'Pending' for too long.  same with a payment!! *** 

https://mintpond.com/b/prop-vs-pplns-vs-pps-mining-pool-reward-systems


https://arxiv.org/pdf/1112.4980.pdf



 




## Task Commands Example
node util/reset_all_miner_reward_data.js




## TODO / BUGS
