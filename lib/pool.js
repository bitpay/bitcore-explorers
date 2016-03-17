'use strict';

var async = require('async');
var bitcore = require('bitcore-lib');
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;

function Pool(elements) {
  $.checkArgument(_.isArray(elements) && elements.length, 'Must provide a set of block explorers');
  this.elements = elements
}

Pool.prototype.broadcast = function(tx, cb) {
  async.map(this.elements, function(element, callback) {
    element.broadcast(tx, callback);
  }, function(err, result) {
    if (err) {
      return cb(err)
    }
    var allEquals = result.reduce(function(prev, next) {
      if (!prev) return next;
      if (prev !== next) return null;
    })
    if (allEquals !== result[0]) {
      return cb('different explorers returned different txids');
    }
    return cb(null, result[0]);
  });
};

Pool.prototype.getUnspentUtxos = function(addresses, callback) {
  async.map(this.elements, function(element, callback) {
    element.getUnspentUtxos(addresses, callback);
  }, function(err, result) {
    if (err) {
      return callback(err)
    }
    if (result.reduce(function(prev, next) {
      return prev || next.length !== result[0].length;
    }, null)) {
      return callback('different explorers returned different values');
    }
    var returnedOutputs = {};
    _.forEach(result, function(utxos) {
      utxos.forEach(function(utxo) {
        var key = utxo.txId.toString('hex') + ':' + utxo.outputIndex
        returnedOutputs[key] = (returnedOutputs[key] || 0) + 1;
      })
    });
    var allEquals = _.values(returnedOutputs).reduce(function (prev, next) {
      return prev && next === result.length;
    }, true);
    if (!allEquals) {
      return callback('different explorers returned different values');
    }
    return callback(null, result[0]);
  });
};

module.exports = Pool;
