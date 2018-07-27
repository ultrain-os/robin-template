const utr = require('u3.js');
const config = require('../config');

u3.Ultrain.abi2json('MyContract','ultrainio');
const ultrain = utr.Ultrain(config);

ultrain.deploy('MyContract', 'utrio.token');