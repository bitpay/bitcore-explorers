'use strict';

var bitcore = require('bitcore-lib');

var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

function FeeEstimation(param) {
  if (!(this instanceof FeeEstimation)) {
    return new FeeEstimation(param);
  }
  if (param instanceof FeeEstimation) {
    return param;
  }

  $.checkArgument(_.isNumber(param.withinBlocks));
  $.checkArgument(_.isNumber(param.feePerKb));

  JSUtil.defineImmutable(this, param);
}

FeeEstimation.fromInsight = function(param) {
  if (_.isString(param)) {
    param = JSON.parse(param);
  }

  var withinBlocks = Object.keys(param)[0]
  var feePerKb = param[withinBlocks] * 1e8

  return new FeeEstimation({
    withinBlocks: parseInt(withinBlocks, 10),
    feePerKb: feePerKb
  });
};

module.exports = FeeEstimation;
