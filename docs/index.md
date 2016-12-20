# Explorers
The `bitcore-explorers` module provides a convenient interface to retrieve unspent transaction outputs and broadcast transactions to the Bitcoin network via blockchain explorers.

## Installation
Explorers is implemented as a separate module.

For node projects:

```
npm install bitcore-lib --save
npm install bitcore-explorers --save
```

For client-side projects:

```
bower install bitcore-lib --save
bower install bitcore-explorers --save
```

## Insight
### Description
`Insight` is a simple agent to perform queries to an Insight blockchain explorer. The default servers are `https://insight.bitpay.com` and `https://test-insight.bitpay.com`, hosted by BitPay Inc. You can (and we strongly suggest you do) run your own Insight server with Bitcore. For more information, head to [https://github.com/bitpay/bitcore](https://github.com/bitpay/bitcore) and [https://github.com/bitpay/insight-api](https://github.com/bitpay/insight-api).

There are currently two methods implemented: `getUnspentUtxos` and `broadcast`. The API will grow as features are requested.

#### Retrieving Unspent UTXOs for an Address (or set of)

```javascript
var Insight = require('bitcore-explorers').Insight;
var insight = new Insight();

insight.getUnspentUtxos('1Bitcoin...', function(err, utxos) {
  if (err) {
    // Handle errors...
  } else {
    // Maybe use the UTXOs to create a transaction
  }
});
```

#### Broadcasting a Transaction

```javascript
var insight = new Insight();
insight.broadcast(tx, function(err, returnedTxId) {
  if (err) {
    // Handle errors...
  } else {
    // Mark the transaction as broadcasted
  }
});
```
