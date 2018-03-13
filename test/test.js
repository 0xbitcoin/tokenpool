

var peerInterface = require('../lib/peer-interface')
var web3utils =  require('web3-utils');


var assert = require('assert');
describe('Peer Interface', function() {
  describe('Estimate Share Hashrate', function() {
    it('should return a good hashrate', function() {


      assert.equal(peerInterface.getEstimatedShareHashrate(50,30000), web3utils.toBN('96000000'));



    });
  });
});
