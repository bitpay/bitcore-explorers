'use strict';

var should = require('chai').should();

var explorers = require('../../');
var AddressInfo = explorers.models.AddressInfo;

describe('AddressInfo', function() {

  describe('instantiation', function() {

    var data = require('./sampleAddressFromInsight.json');
    var addressInfo = AddressInfo.fromInsight(data);


    it('works with both strings and objects', function() {
      AddressInfo.fromInsight(JSON.stringify(data)).should.deep.equal(addressInfo);
    });

    it('parses correctly a sample response on Insight for address mmvP3mTe53qxHdPqXEvdu8WdC7GfQ2vmx5', function() {
      should.exist(addressInfo);
      addressInfo.address.toString().should.equal('mmvP3mTe53qxHdPqXEvdu8WdC7GfQ2vmx5');
      addressInfo.balance.should.equal(552461906422);
      addressInfo.totalSent.should.equal(663303268631);
      addressInfo.totalReceived.should.equal(1215765175053);
      addressInfo.unconfirmedBalance.should.equal(100000000000);
      addressInfo.transactionIds.length.should.equal(444);
    });

    it('returns the same instance if an AddressInfo is provided', function() {
      (new AddressInfo(addressInfo)).should.equal(addressInfo);
    });

    it('can be instantiated without new', function() {
      (AddressInfo(addressInfo)).should.equal(addressInfo);
    });

  });

});
