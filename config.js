const network = {
  httpEndpoint: 'http://127.0.0.1:8888',
  broadcast: true,
  debug: false,
  sign: true
};
const wif = '5J96TDpA5GLERPYwu3FaxCWwvFQaQYZ14GDKh371NsCavPmR3vp';

const config = Object.assign({}, network, { binaryen: require('binaryen'), keyProvider:wif });
module.exports = config;