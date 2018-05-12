### Stratum Server

The server is implemented in `lib/stratum-server.js`.  It is designed to be run in its own  Node instance, separate from the other modules .  It can be launched with `npm run stratum`.

It currently listens on port 9192, but that can be changed in the source.  

It inserts submitted miner shares into redis exactly the way `peer-interface.js` does, so the back-end share processing is unchanged.

The stratum server needs to be notified when a new challenge comes in, when a miner's varDiff changes, and when a new ETH block number comes in.  I implemented this using the Redis pub/sub feature.  Therefore, a few code changes are required in `peer-interface.js`, `token-interface.js` and `index.js`.

**Miner Support**

Currently MVis-tokenminer v2.1.14 BETA supports the stratum protocol.  If other miner developers are unable to add support in time for roll-out, maybe we could look at developing a 'stratum proxy' -- a small program that runs on the mining machine, or local LAN, and links a miner using legacy getwork with a stratum pool.  There are several [existing ones](https://www.google.ca/search?client=opera&q=stratum+proxy&sourceid=opera&ie=UTF-8&oe=UTF-8) that could be adapted.

### Stratum Protocol 

Currently only `mining.subscribe`, `mining.notify` and `mining.submit` are implemented.

Sample communication between miner and the pool:

**mining.subscribe**
```
Miner -> Pool:

{
  "id": 1,
  "method": "mining.subscribe",
  "params": ["0x1b7bfb694ee51913c347971c7090a74aefbd41f6"]    // miner ETH account
}

Response:
{
  "id": 1,
  "result": true,
  "error": null
}
```

**mining.notify**
```
Pool -> Miner:

{
  "method": "mining.notify",
  "params": [
    "0x6770629a6ede9af78856c91eab295779d294328de910c8a85b174dd85f843b3e",     // challenge 
    "31659386911883320125847503955399199323170224642983424564965707448620",   // target (decimal)
    872,                                                                      // difficulty (decimal)
    "0x1b7bfB694eE51913c347971c7090a74AEFbd41f6"                              // pool ETH address
  ]
}

Response:
   [NONE]
```


**mining.submit**
```
Miner -> Pool:

{
  "id": 4,
  "method": "mining.submit",
  "params": [
    "0x315bc11bfc4c7d35c34d75030f2ad300000000004111c4fa6169e2193288e8fe",    // nonce 
    "0x1b7bfb694ee51913c347971c7090a74aefbd41f6",                            // miner ETH address
    "0x00000000f349061fd0e3b1db5324ef44356fae1cc51febedcef137532140b0ec",    // digest
    872,                                                                     // difficulty (decimal)
    "0x6770629a6ede9af78856c91eab295779d294328de910c8a85b174dd85f843b3e"     // challenge
  ]
}

Response:
{
  "id": 4,
  "result": true,
  "error": null
}
```

**Sample error response:**

```
{
  "id": 4,
  "result": false,
  "error": [
    21,                             // numeric error code
    "Wrong challenge number"        // human readable text
  ]
}
```