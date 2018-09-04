const network = {
  httpEndpoint: "http://127.0.0.1:8888",
  broadcast: true,
  debug: false,
  verbose: false,
  sign: true,
  logger: {
    log: console.log,
    error: console.error,
    debug: console.log
  }
};
const wif = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
const config = Object.assign({}, network, { keyProvider:wif });
module.exports = config;