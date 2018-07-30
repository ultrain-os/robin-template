const u3 = require('u3.js');
const config = require('../config');

u3.Ultrain.abi2json('MyContract','ultrainio');
const ultrain = u3.Ultrain(config);

ultrain.deploy('MyContract', 'utrio.token');