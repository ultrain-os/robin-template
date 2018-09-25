import { Contract } from 'ultrain-ts-lib/src/contract';
import { Log } from 'ultrain-ts-lib/src/log';
import { RN, N } from 'ultrain-ts-lib/lib/name';
import { EventObject, emit } from 'ultrain-ts-lib/src/events';

class MyContract extends Contract {

  @action
  hi(name: u64, age: u32, msg: string): void {
    Log.s('hi: name = ').s(RN(name)).s(' age = ').i(age, 10).s(' msg = ').s(msg).flush();
    emit('onHiInvoked', EventObject.setString('name', RN(name)));
  }
}
