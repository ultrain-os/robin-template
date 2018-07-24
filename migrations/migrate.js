const utr = require('u3.js');
const config = require('../config');

const ultrain = utr.Ultrain(config);

ultrain.deploy('MyContract', 'utrio.token');