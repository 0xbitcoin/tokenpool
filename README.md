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


### BASIC SETUP  (needs Node 8.10)
1. npm install -g node-gyp
1.1. sudo apt-get install build-essential

You may need to do.. (depending on operating system and python version)
1.2.sudo apt-get install python2.7
1.3.npm config set python python2.7

2. npm install

3. rename 'sample.account.config.js' to 'account.config.js' and fill it with the pool's ethereum account data (make two new accounts, one for minting one for payments and fill both with a small amount of ETH)

4. install redis-server and start it with 'npm run redis' in another screen ('screen -S redis', ctrl+shift+A+D)

5. Edit pool.config.js to your tastes (optional)

6. Deploy two contracts (see the section below) and add their addresses to app/assets/contracts/DeployedContractInfo.json

7. Edit the website files in /app  to change the look of the website (optional)
8. Install mongodb, make sure it is running as a daemon service
9. 'npm run webpack'  #(to build the website files)
10. 'npm run server' #(or 'npm run server test 'for Ropsten test mode)



### CONFIGURING  - set up  account.config.js and pool.config.js

##### pool.config.js

```
var poolconfig = {
  minimumShareDifficulty: 5000,   //lowest miner share difficulty
  maximumShareDifficulty: 10000    //highest miner share difficulty
  maxSolutionGasPriceWei: 10,   //ether paid by the pool for each mint
  maxTransferGasPriceWei: 6,   //ether paid by the pool for each payment
  poolTokenFee: 5,     //percent of tokens the pool keeps for itself
  communityTokenFee: 2,   //percent of tokens the pool pledges to donate
  minBalanceForTransfer: 1500000000,   
  payoutWalletMinimum: 100000000000,
  allowCustomVardiff: false,
  rebroadcastPaymentWaitBlocks: 500,
  minPaymentsInBatch: 5,
  //web3provider: "http://127.0.0.1:8545"   //point at Geth or remove to use Infura
}
```

## Deploying Contracts
####     [found in app/assets/contracts/deployedContractInfo.json]
EDIT THIS FILE!!!

* Replace 'mintforwarder' address with your own deployed version of the contract !!!
* Replace 'batch payments' contract address as well !!! your own deployed contract !!

Here are examples of these contracts to copy and paste the code and deploy using https://remix.ethereum.org:

Mint Helper (Mint Forwarder) Contract Code:
https://etherscan.io/address/0xeabe48908503b7efb090f35595fb8d1a4d55bd66#code

Batched Payments Contract Code:
https://etherscan.io/address/0xebf6245689194a6e43096551567827c6726ede0b#code


## HOW TO TEST
1. Point a EIP918 tokenminer (https://github.com/0xbitcoin/0xbitcoin-miner) at your pool using http://localhost:8080   (make sure firewall allows this port)
2. Start the server with 'npm run webpack' and 'npm run server test' to put it into ropsten mode
3. View website interface at http://localhost:3000 (Feel free to set up nginx/apache to serve the static files in /public)

You should see that the miner is able to successfully submit shares to the pool when the share difficulty is set to a low value such as 100 and the pool is in 'ropsten mode'.  Then you can run the pool on mainnet using 'npm run server'.


## Installing MongoDB

Digitalocean guide:
https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04#step-3-%E2%80%94-adjusting-the-firewall-(optional)

 - Mongo is used to store data related to miner shares, balances, and payments

 (WSL: sudo mongod --dbpath ~/data/db)



## DEV TODO 
1. Remove Redis and replace with mongo 
2. Update the frontend to a more modernized Vue architecture 
3. Fix gas price oracles 
4. Move the payouts system to Matic
5. Integrate PPS instead of Proportional Payouts (https://en.bitcoin.it/wiki/Comparison_of_mining_pools)
6. Search, better interface on mobile 
7. disconnect all miners when pool is on standby, API will say pool is in standby  (show on pool page) 

https://mintpond.com/b/prop-vs-pplns-vs-pps-mining-pool-reward-systems


https://arxiv.org/pdf/1112.4980.pdf


## Task Commands Example
node util/reset_all_miner_reward_data.js




## TODO / BUGS
