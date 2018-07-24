const utr = require('u3.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let deploy = async (contract, account = 'ultrainio') => {
  const ultrain = utr.Ultrain(config);
  const wasm = fs.readFileSync(path.resolve(__dirname, `../build/${contract}.wast`));
  const abi = fs.readFileSync(path.resolve(__dirname, `../build/${contract}.abi`));

  ultrain.setcode(account, 0, 0, wasm);
  ultrain.setabi(account, JSON.parse(abi));

  await ultrain.getCode(account);
};
deploy('MyContract', 'utrio.token');