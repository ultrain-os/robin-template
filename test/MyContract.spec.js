const { createU3, U3Utils } = require("u3.js");
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
    const result = await contract.hi("ben", 30, "It is a test", { authorization: [`ben@active`] });


    // first check whether the transaction was failed
    if (!result || result.processed.receipt.status !== "executed") {
      console.log("the transaction was failed");
      return;
    }

    // then check whether the transaction was irreversible when it was not expired
    let timeout = new Date(result.transaction.transaction.expiration + "Z") - new Date();
    let finalResult = false;
    try {
      await U3Utils.test.waitUntil(async () => {
        let tx = await u3.getTxByTxId(result.transaction_id);
        finalResult = tx && tx.irreversible;
        if (finalResult) return true;
      }, timeout, 1000);
    } catch (e) {
      console.log(finalResult);
    }
  });
});
