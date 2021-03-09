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

5. 'npm run server' #(or 'npm run server staging 'for staging test mode)



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
1. Remove Redis and replace with mongo   [done]
2. Update the frontend to a more modernized Vue architecture  [done] 
3. Fix gas price oracles  (use bree?)
4. Move the payouts system to Matic 
5. Integrate PPS instead of Proportional Payouts [done] 
6. Search, better interface on mobile  [done] 
7. disconnect all miners when pool is on standby, API will say pool is in standby  (show on pool page) 

8. Make batchpayments piece optional  via config (for farmer pools) [done] 

 
9. show payment tokens and their approval to the payments contract - on pool overview , make it easy for pool owner to approve tokens to it (dapp button) 
10. fix hashrate chart 
11. display many stats on overview like gas prices  [done]  
12. implement suspension and overriding it using the poolconfig  [done]  


https://mintpond.com/b/prop-vs-pplns-vs-pps-mining-pool-reward-systems


https://arxiv.org/pdf/1112.4980.pdf


## Task Commands Example
node util/reset_all_miner_reward_data.js




## TODO / BUGS
