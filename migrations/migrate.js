const utr = require('ultrain-jssdk');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ultrain = utr.Ultrain(config);
let deploy = async (contract, account = 'ultrainio') => {

  const wasm = fs.readFileSync(path.resolve(__dirname, `../build/${contract}.wast`));
  const abi = fs.readFileSync(path.resolve(__dirname, `../build/${contract}.abi`));

  ultrain.setcode(account, 0, 0, wasm);
  ultrain.setabi(account, JSON.parse(abi));

  const code = await ultrain.getCode(account);
  console.log(code);
};
deploy('MyContract', 'ultrainio');
