### Token Mining Pool  

Developed by the 0xBitcoin Community

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


### BASIC SETUP  (needs Node 10) [nvm install 10]
 
1. npm install

2. rename 'sample.pool.config.json' to 'pool.config.json' and fill it with the pool's ethereum account data (make two new accounts, one for minting one for payments and fill both with a small amount of ETH)

3. Install mongodb, make sure it is running as a service

4. 'npm run build'  #(to build the website files)

5. 'npm run pool' #(or 'npm run pool staging 'for staging test mode)

6. 'npm run express' (in a separate screen to serve HTML) 
 



### CONFIGURING  - set up  pool.config.json

##### pool.config.json

 



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
1. Optimize gas price oracles task runner (use bree?)
 
2. disconnect all miners when pool is on standby, API will say pool is in standby  (show on pool page) 
 
3. show payment tokens and their approval to the payments contract - on pool overview , make it easy for pool owner to approve tokens to it (dapp button) 
4. fix hashrate chart 

5. add stratum https://mvis.ca/stratum-spec.html

6. *** Make sure that if a mint() gets stuck that it is cleared out !! Like  if it stuck 'Pending' for too long.  same with a payment!! *** 

https://mintpond.com/b/prop-vs-pplns-vs-pps-mining-pool-reward-systems


https://arxiv.org/pdf/1112.4980.pdf


## Task Commands Example
node util/reset_all_miner_reward_data.js




## TODO / BUGS
