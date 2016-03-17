'use strict';

var request = require('request');
var async = require('async');

var bitcore = require('bitcore-lib');
var _ = bitcore.deps._;

var $ = bitcore.util.preconditions;
var Address = bitcore.Address;
var JSUtil = bitcore.util.js;
var Networks = bitcore.Networks;
var Transaction = bitcore.Transaction;
var UnspentOutput = Transaction.UnspentOutput;
var AddressInfo = require('./models/addressinfo');

var OPTS = '?unspentOnly=true&includeScript=true';


/**
 * @param {string=} url the url of the BlockCypher server
 * @param {Network=} network whether to use livenet or testnet
 * @constructor
 */
function BlockCypher(url, network) {
  if (!url && !network) {
    return new BlockCypher(Networks.defaultNetwork);
  }
  if (Networks.get(url)) {
    network = Networks.get(url);
    url = 'https://api.blockcypher.com/v1/btc/' + (
      network === Networks.livenet ? 'main' : 'test3'
    )
  }
  JSUtil.defineImmutable(this, {
    url: url,
    network: Networks.get(network) || Networks.defaultNetwork
  });
  this.request = request;
  return this;
}

BlockCypher.prototype.getUnspentUtxos = function(addresses, callback) {
  var self = this;
  $.checkArgument(_.isFunction(callback));
  if (!_.isArray(addresses)) {
    addresses = [addresses];
  }
  addresses = _.map(addresses, function(address) {
    return new Address(address);
  });

  async.map(addresses, function(address, cb) {
    self._getAddress(address, cb)
  }, function(err, results) {
    if (err) {
      return callback(err);
    }
    return callback(null, _.flatten(results));
  });
};

function getMaybeArray(array) {
  return _.isArray(array) ? array : [];
}

function blockcypherToBitcoreOutputFormat(output) {
  return {
    txId: output.tx_hash,
    outputIndex: output.tx_output_n,
    satoshis: output.value,
    script: output.script,
    address: new bitcore.Address(new bitcore.Script(output.script))
  };
}

function processAddressInfoIntoOutputs(rawInfo) {
  rawInfo = JSON.parse(rawInfo)
  var txs = getMaybeArray(rawInfo.txrefs);
  var unconfirmed = getMaybeArray(rawInfo.unconfirmed_txrefs);

  return txs.concat(unconfirmed)
    .map(blockcypherToBitcoreOutputFormat)
    .map(bitcore.Transaction.UnspentOutput);
}

BlockCypher.prototype._getAddress = function(address, cb) {
  this.requestGet('/addrs/' + address.toString() + OPTS, function(err, res, body) {
    if (err || res.statusCode !== 200) {
      return cb(err || body);
    }
    return cb(null, processAddressInfoIntoOutputs(body))
  });
};

BlockCypher.prototype.broadcast = function(transaction, callback) {
  $.checkArgument(JSUtil.isHexa(transaction) || transaction instanceof Transaction);
  $.checkArgument(_.isFunction(callback));
  if (transaction instanceof Transaction) {
    transaction = transaction.serialize();
  }

  this.requestPost('/tx/push', {
    tx: transaction
  }, function(err, res, body) {
    if (err || res.statusCode !== 201) {
      return callback(err || body);
    }
    return callback(null, body ? body.hash : null);
  });
};


/**
 * Internal function to make a post request to the server
 * @param {string} path
 * @param {?} data
 * @param {function} callback
 * @private
 */
BlockCypher.prototype.requestPost = function(path, data, callback) {
  $.checkArgument(_.isString(path));
  $.checkArgument(_.isFunction(callback));
  this.request({
    method: 'POST',
    url: this.url + path,
    headers: { 'Content-Type': 'application/json' },
    json: data
  }, callback);
};

/**
 * Internal function to make a get request with no params to the server
 * @param {string} path
 * @param {function} callback
 * @private
 */
BlockCypher.prototype.requestGet = function(path, callback) {
  $.checkArgument(_.isString(path));
  $.checkArgument(_.isFunction(callback));
  this.request({
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    url: this.url + path
  }, callback);
};

module.exports = BlockCypher;
