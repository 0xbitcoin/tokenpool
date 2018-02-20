### Token Mining Pool  

A pool for mining 'energy' tokens such as 0xBTC



### BASIC SETUP  
1. yarn
2. npm install
3. rename 'sample.account.config.js' to 'account.config.js' and fill it with the pool's ethereum account data
4. install redis-server and make sure it is running


### HOW TO USE
1. Point a poolminer at with http://localhost:8586
2. View website interface at http://localhost:3000


## Requires    Redis connection to 127.0.0.1:6379
  1. sudo apt-get install redis



## TODO
- add a table on the dashboard which shows solutions attempted - to help debug
- get var diff working
- actually transfer tokens every hour
