import { Contract } from 'ultrain-ts-lib/src/contract';
import { Log } from 'ultrain-ts-lib/src/log';
import { NAME, RNAME} from 'ultrain-ts-lib/src/account';
import { EventObject, emit } from 'ultrain-ts-lib/src/events';

class MyContract extends Contract {

  @action
  hi(name: account_name, age: u32, msg: string): void {
    Log.s('hi: name = ').s(RNAME(name)).s(' age = ').i(age, 10).s(' msg = ').s(msg).flush();
    emit('onHiInvoked', EventObject.setString('name', RNAME(name)));
  }
}
