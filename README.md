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





#### Add eip1559 
 
sudo npm install @ethereumjs/tx
Then in lib/transaction-coordinator.js
I added this to the very top
var cluster = require('cluster')

const Tx = require('ethereumjs-tx').Transaction

const { FeeMarketEIP1559Transaction } = require( '@ethereumjs/tx' );
var web3Utils = require('web3-utils')
const Common = require('@ethereumjs/common');
const { Chain, Hardfork } = require('@ethereumjs/common');
 var lastRebroadcastBlock = 0;
//
//___ Then at the bottom of transaction-coordinator.js i changed the way it submits the answer to:


      const txOptions = {
        nonce: web3Utils.toHex(txCount),
        gasLimit: web3Utils.toHex(estimatedGasCost),
    maxFeePerGas: web3Utils.toHex( web3Utils.toWei( '1.5' , 'gwei' ) ),
    maxPriorityFeePerGas: web3Utils.toHex( web3Utils.toWei( '1.5' , 'gwei' ) ),
        value: 0,
        to: addressTo,
        data: txData,
    chainId: web3Utils.toHex(3),
    type: "0x02"
      }
      var privateKey =  this.getMintingAccount().privateKey;

      ret['tx_hash'] = await  new Promise(function (result,error) {

         this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,privateKey, function(err, res) {
          if (err) error(err)
            result(res)
        })

      }.bind(this));

      return ret;

    },




    async sendSignedRawTransaction(web3,txOptions,addressFrom,private_key,callback) {

      var privKey = this.truncate0xFromString( private_key )

      const privateKey = new Buffer( privKey, 'hex')
    console.log(txOptions);
      const tx = FeeMarketEIP1559Transaction.fromTxData( txOptions, { chain: 'ropsten', hardfork: 'london' }  );
    const signedTransaction = tx.sign( privateKey );

    console.log(await web3.eth.net.getId());
      const serializedTx2 = signedTransaction.serialize().toString('hex')

        try
        {
          var result =  web3.eth.sendSignedTransaction('0x' + serializedTx2)
        }catch(e)
        {
          console.log('error fail send signed',e);
        }
    }







## Task Commands Example
node util/reset_all_miner_reward_data.js




## TODO / BUGS
