import { Contract } from "ContractSdk/src/contract";
import { Log } from "ContractSdk/src/log";
import { RN, N } from "ContractSDK/lib/name";
import { EventObject, emit } from "ContractSDK/src/events";

class MyContract extends Contract {

  @action
  hi(name: u64, age: u32, msg: string): void {
    Log.s("hi: name = ").s(RN(name)).s(" age = ").i(age, 10).s(" msg = ").s(msg).flush();
    emit("onHiInvoked", EventObject.setString("name", RN(name)));
  }
}
