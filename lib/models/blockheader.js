'use strict';

var bitcore = require('bitcore-lib');

var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

function BlockHeader(param) {
  if (!(this instanceof BlockHeader)) {
    return new BlockHeader(param);
  }
  if (param instanceof BlockHeader) {
    return param;
  }

  $.checkArgument(JSUtil.isHexa(param.hash));
  $.checkArgument(_.isNumber(param.height));
  $.checkArgument(_.isNumber(param.size));
  $.checkArgument(_.isNumber(param.time));
  $.checkArgument(_.isNumber(param.txlength));
  $.checkArgument(_.isNumber(param.txlength));
  $.checkArgument(_.isObject(param.poolInfo));

  JSUtil.defineImmutable(this, param);
}

BlockHeader.fromInsight = function(param) {
  if (_.isString(param)) {
    param = JSON.parse(param);
  }
  return new BlockHeader({
    hash: param.hash,
    height: param.height,
    size: param.size,
    time: param.time,
    txlength: param.txlength,
    poolInfo: param.poolInfo
  });
};

module.exports = BlockHeader;
