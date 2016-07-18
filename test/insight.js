'use strict';

var sinon = require('sinon');
var should = require('chai').should();
var expect = require('chai').expect;
var bitcore = require('bitcore-lib');
var explorers = require('../');

var Insight = explorers.Insight;
var Address = bitcore.Address;
var Transaction = bitcore.Transaction;
var AddressInfo = explorers.models.AddressInfo;
var Networks = bitcore.Networks;

describe('Insight', function() {

  describe('instantiation', function() {
    it('can be created without any parameters', function() {
      var insight = new Insight();
      should.exist(insight.url);
      should.exist(insight.network);
      if (insight.network === Networks.livenet) {
        insight.url.should.equal('https://insight.bitpay.com');
      } else if (insight.network === Networks.testnet) {
        insight.url.should.equal('https://test-insight.bitpay.com');
      }
    });
    it('can be created providing just a network', function() {
      var insight = new Insight(Networks.testnet);
      insight.url.should.equal('https://test-insight.bitpay.com');
      insight.network.should.equal(Networks.testnet);
    });
    it('can be created with a custom url', function() {
      var url = 'https://localhost:1234';
      var insight = new Insight(url);
      insight.url.should.equal(url);
    });
    it('can be created with a custom url and network', function() {
      var url = 'https://localhost:1234';
      var insight = new Insight(url, Networks.testnet);
      insight.url.should.equal(url);
      insight.network.should.equal(Networks.testnet);
    });
    it('defaults to defaultNetwork on a custom url', function() {
      var insight = new Insight('https://localhost:1234');
      insight.network.should.equal(Networks.defaultNetwork);
    });
  });

  describe('getting unspent utxos', function() {
    var insight = new Insight();
    var address = '371mZyMp4t6uVtcEr4DAAbTZyby9Lvia72';
    beforeEach(function() {
      insight.requestPost = sinon.stub();
      insight.requestPost.onFirstCall().callsArgWith(2, null, {
        statusCode: 200
      });
    });
    it('can receive an address', function(callback) {
      insight.getUnspentUtxos(new Address(address), callback);
    });
    it('can receive a address as a string', function(callback) {
      insight.getUnspentUtxos(address, callback);
    });
    it('can receive an array of addresses', function(callback) {
      insight.getUnspentUtxos([address, new Address(address)], callback);
    });
    it('errors if server is not available', function(callback) {
      insight.requestPost.onFirstCall().callsArgWith(2, 'Unable to connect');
      insight.getUnspentUtxos(address, function(error) {
        expect(error).to.equal('Unable to connect');
        callback();
      });
    });
    it('errors if server returns errorcode', function(callback) {
      insight.requestPost.onFirstCall().callsArgWith(2, null, {
        statusCode: 400
      });
      insight.getUnspentUtxos(address, function(error) {
        expect(error).to.deep.equal({
          statusCode: 400
        });
        callback();
      });
    });
    it('errors if server returns invalid data', function(callback) {
      var invalidUtxo = {
        address: '2MvQs7cJe49fbukkTLwhSYnV3hSXe6Bu8tb',
        txid: '7d1eea0c7bed061a6ce1b49d57ef385621766e765bc3ed48bde04d816a4c3ea8',
        vout: 1,
        ts: 1428103500,
        amount: 0.000198,
        confirmations: 6,
        confirmationsFromCache: true
      };
      insight.requestPost.onFirstCall().callsArgWith(2, null, {
        statusCode: 200
      }, [invalidUtxo]);
      insight.getUnspentUtxos(address, function(error, unspent) {
        expect(error).to.exist;
        expect(error.name).to.equal('bitcore.ErrorInvalidArgument');
        expect(error.toString()).to.contain('scriptPubKey');
        callback();
      });
    });
  });

  describe('getting median time for blocks', function() {
    var insight = new Insight();
    beforeEach(function() {
      insight.requestGet = sinon.stub();
      insight.requestGet.onFirstCall().callsArgWith(1, null, {
        statusCode: 200
      }, JSON.parse(MEAN_BLOCK_INFO));
    });
    it('is calculated correctly', function(callback) {
      insight.getMedianTime(function(err, res) {
        if (err) {
          return callback(err)
        }
        expect(res).to.equal(1468848613)
        callback()
      });
    });
  })

  describe('broadcasting a transaction', function() {
    var insight = new Insight();
    beforeEach(function() {
      insight.requestPost = sinon.stub();
      insight.requestPost.onFirstCall().callsArgWith(2, null, {
        statusCode: 200
      });
    });
    it('accepts a raw transaction', function(callback) {
      insight.broadcast(rawTx, callback);
    });
    it('accepts a transaction model', function(callback) {
      var tx = new Transaction()
        .from({
          "txid": "e42447187db5a29d6db161661e4bc66d61c3e499690fe5ea47f87b79ca573986",
          "vout": 1,
          "address": "mgBCJAsvzgT2qNNeXsoECg2uPKrUsZ76up",
          "scriptPubKey": "76a914073b7eae2823efa349e3b9155b8a735526463a0f88ac",
          "amount": 0.01080000
        })
        .to("mn9new5vPYWuVN5m3gUBujfKh1uPQvR9mf", 500000)
        .change("mw5ctwgEaNRbxkM4JhXH3rp5AyGvTWDZCD")
        .sign("cSQUuwwJBAg6tYQhzqqLWW115D1s5KFZDyhCF2ffrnukZxMK6rNZ");
      insight.broadcast(tx, callback);
    });
    it('errors if server is not available', function(callback) {
      insight.requestPost.onFirstCall().callsArgWith(2, 'Unable to connect');
      insight.broadcast(rawTx, function(error) {
        expect(error).to.equal('Unable to connect');
        callback();
      });
    });
    it('errors if server returns errorcode', function(callback) {
      insight.requestPost.onFirstCall().callsArgWith(2, null, {
        statusCode: 400
      }, 'error');
      insight.broadcast(rawTx, function(error) {
        expect(error).to.equal('error');
        callback();
      });
    });
  });
  describe('requestPost', function() {
    var insight = new Insight();
    insight.request = sinon.stub();
    insight.request.onFirstCall().callsArgWith(1);
    it('works', function(cb) {
      insight.requestPost('some/path', {}, cb);
    });
  });

  describe('get information about an address', function() {
    var insight = new Insight();
    var data = require('./models/sampleAddressFromInsight.json');
    beforeEach(function() {
      insight.requestGet = sinon.stub();
      insight.requestGet.onFirstCall().callsArgWith(1, null, {
        statusCode: 200
      }, JSON.stringify(data));
    });
    it('makes the request as expected', function(cb) {
      insight.address('mmvP3mTe53qxHdPqXEvdu8WdC7GfQ2vmx5', function(err, addressInfo) {
        (addressInfo instanceof AddressInfo).should.equal(true);
        cb();
      });
    });
    it('calls with error on parse error', function(cb) {
      insight.requestGet.onFirstCall().callsArgWith(1, null, {
        statusCode: 200
      }, 'malformed json');
      insight.address('mmvP3mTe53qxHdPqXEvdu8WdC7GfQ2vmx5', function(err) {
        should.exist(err);
        err.toString().should.contain('SyntaxError');
        cb();
      });
    });
  });
});

var rawTx = '01000000015884e5db9de218238671572340b207ee85b628074e7e467096c267266baf77a4000000006a473044022013fa3089327b50263029265572ae1b022a91d10ac80eb4f32f291c914533670b02200d8a5ed5f62634a7e1a0dc9188a3cc460a986267ae4d58faf50c79105431327501210223078d2942df62c45621d209fab84ea9a7a23346201b7727b9b45a29c4e76f5effffffff0150690f00000000001976a9147821c0a3768aa9d1a37e16cf76002aef5373f1a888ac00000000';

var MEAN_BLOCK_INFO = '{"blocks":[{"height":898316,"size":29844,"hash":"00000000d497906bce3af03b7de22ca444ced26b85ddad8047a0d11bb917a233","time":1468852240,"txlength":40,"poolInfo":{}},{"height":898315,"size":6599,"hash":"00000000000001404796731c65a658dd8dc4a0063267c2562d8301647d817bdd","time":1468851039,"txlength":6,"poolInfo":{}},{"height":898314,"size":29220,"hash":"00000000000131a274089655dc80ead6901aee29df649408a76e8158786bb514","time":1468850886,"txlength":77,"poolInfo":{}},{"height":898313,"size":14956,"hash":"00000000000000438ed662fceca5f8ee3a19024116d48b1cfcdbed5ffab90a09","time":1468849685,"txlength":35,"poolInfo":{}},{"height":898312,"size":34910,"hash":"0000000000000047a756826e6e77cd4565da78b6cffb1338b7ec8fe4eb9ab4cd","time":1468849431,"txlength":57,"poolInfo":{}},{"height":898311,"size":29621,"hash":"00000000000000cd21b1cc472a4f0dc8999a89562a44736790e5eeee2fb3ab19","time":1468848613,"txlength":45,"poolInfo":{}},{"height":898310,"size":26462,"hash":"000000008edd8b60f7e5386246ff6ddfe9b3c7ecb254578f529e38d24977c13c","time":1468848345,"txlength":73,"poolInfo":{}},{"height":898309,"size":17236,"hash":"00000000111ed42cf4e2fe4e85b795d32af5b46daa5daf702e44954eec07c1d5","time":1468847144,"txlength":52,"poolInfo":{}},{"height":898308,"size":10992,"hash":"0000000000000163e85230a6f401323c05894e3e5223f6cf4d2b94d0ddf7aa74","time":1468845885,"txlength":35,"poolInfo":{}},{"height":898307,"size":16435,"hash":"00000000d20e380c493e41f6d42c74ce65b0731e4a9476c129163cd02526d59e","time":1468844920,"txlength":43,"poolInfo":{}},{"height":898306,"size":2976,"hash":"000000000000011aadc28025b87827d4738294acb0d803accb5cb864edb53b6d","time":1468843718,"txlength":13,"poolInfo":{}}],"length":11,"pagination":{"next":"2016-07-19","prev":"2016-07-17","currentTs":1468886399,"current":"2016-07-18","isToday":true,"more":true,"moreTs":1468886400}}';
