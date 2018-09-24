const config = {
  httpEndpoint: "http://127.0.0.1:8888",
  broadcast: true,
  debug: false,
  verbose: false,
  sign: true,
  logger: {
    log: console.log,
    error: console.error,
    debug: console.log
  },
  chainId:'2616bfbc21e11d60d10cb798f00893c2befba10e2338b7277bb3865d2e658f58',
  keyProvider:'5Hw4r3QSmiDFq3qkYfvkzew86agrKHRN9j478CqjuyPMV3ERJuF',
  binaryen: require('binaryen')
};
module.exports = config;