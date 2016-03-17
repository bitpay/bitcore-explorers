var BC = require('../lib/blockcypher')
var I = require('../lib/insight')
var P = require('../lib/pool')

var bc = new BC()
var i = new I()
var p = new P([bc, i])

p.getUnspentUtxos('1Eg5c8YAdTo48qCMh6WBH1BgXw6isfYLh9', function(err, res) {
  console.log(err, res)
})

