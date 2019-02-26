const U3Utils = require("u3-utils/src");
const { createU3, format, listener } = require("u3.js/src");
const config = require("../config");

const chai = require("chai");
require("chai")
  .use(require("chai-as-promised"))
  .should();

const should = chai.should();

describe("Test cases", function() {

  it("transaction", async () => {

    let account = "ben";
    const u3 = createU3(config);
    const contract = await u3.contract(account);
    await contract.hi("ben", 30, "It is a test", { authorization: [`ben@active`] });
  });


  it("block", async () => {

    let account = "ben";
    const u3 = createU3(config);
    const contract = await u3.contract(account);
    const tx = await contract.hi("ben", 30, "It is a test", { authorization: [`ben@active`] });

    //wait max a minute util it was packed in a block
    let tx_trace = await u3.getTxByTxId(tx.transaction_id);
    let time = 0;
    let timer = setInterval(async () => {
      time++;
      if (time >= 60) {
        clearInterval(timer);
        return;
      }
      tx_trace = await u3.getTxByTxId(tx.transaction_id);
      if (tx_trace.irreversible) {
        console.log("Confirmed success");
        clearInterval(timer);
      } else {
        // eslint-disable-next-line
        console.log("Waiting " + time + "s");
      }
    }, 1000);

  });
});
