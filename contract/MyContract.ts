import { RN } from "ContractSDK/src/utils";
import { Log } from "ContractSDK/src/log";
import { Contract } from "ContractSDK/lib/contract";
class HelloWorld extends Contract {
  @action
  hi(name: u64, age: u32, msg: string): void {
    Log.s("hi: name = ")
      .s(RN(name))
      .s(" age = ")
      .i(age, 10)
      .s(" msg = ")
      .s(msg)
      .flush();
  }
}
