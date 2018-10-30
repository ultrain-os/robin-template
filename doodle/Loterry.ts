import { Contract } from "ultrain-ts-lib/src/contract";
import { Log } from "ultrain-ts-lib/src/log";
//import { EventObject, emit } from "ultrain-ts-lib/src/events";
import { RNAME, NAME } from "ultrain-ts-lib/src/account";
import { Return, ReturnArray } from "ultrain-ts-lib/src/return";
import { Action } from "ultrain-ts-lib/src/action";
import { DBManager } from "ultrain-ts-lib/src/dbmanager";
import { ultrain_assert } from "ultrain-ts-lib/src/utils";
import { HeadBlock } from "ultrain-ts-lib/lib/headblock";
import { LocalTime, GmtTime, now } from "ultrain-ts-lib/src/time";

class Staff implements Serializable {
  account: account_name;
  points: u32;   // record awards for winner in lucky draw.
  permission: u32;
  absent: boolean;
  office: u32;
  name: string;

  constructor(account: account_name, display_name: string = 'anonymity', office_code: u32 = 0) {
    this.account = account;
    this.points = 0;
    this.permission = 1;
    this.absent = <boolean>false;
    this.office = office_code;
    this.name   = display_name;
  }

  // serialize(ds: DataStream): void {
  //   ds.write<account_name>(this.account);
  //   ds.write<u32>(this.points);
  //   ds.write<u32>(this.permission);
  //   ds.write<boolean>(this.absent);
  //   ds.write<u32>(this.office);
  //   ds.writeString(this.name);
  // }

  // deserialize(ds: DataStream): void {
  //   this.account = ds.read<account_name>();
  //   this.points = ds.read<u32>();
  //   this.permission = ds.read<u32>();
  //   this.absent = ds.read<boolean>();
  //   this.office = ds.read<u32>();
  //   this.name = ds.readString();
  // }

  primaryKey(): id_type {
    return this.account;
  }

  print(): void {
    Log.s('name: ').s(this.name).s(' office: ').i(this.office).s(' permission: ').i(this.permission).s(' points: ').i(this.points).flush();
  }
}

class Office implements Serializable {
  office: u32;
  members: Array<account_name>;

  constructor(office_code: u32) {
    this.office = office_code;
    this.members = new Array<account_name>();
  }

  serialize(ds: DataStream): void {
    ds.write<u32>(this.office);
    ds.writeVector<account_name>(this.members);
  }

  deserialize(ds: DataStream): void {
    this.office = ds.read<u32>();
    this.members = ds.readVector<account_name>();
  }

  primaryKey(): id_type {
    return <id_type>this.office;
  }
}

class LotteryRecord implements Serializable {
  id: id_type;
  timestamp: time;
  host: account_name;
  office_code: u32;
  points_value: u32;
  lucky_dogs: Array<account_name>;
  current_id: id_type;

  constructor(office: u32) {
    this.id = <id_type> 0;
    this.timestamp = now();
    this.host = 0;
    this.office_code = office;
    this.points_value = 10;
    this.lucky_dogs = new Array<account_name>();
    this.current_id = <id_type> 0;
  }

  serialize(ds: DataStream): void {
    ds.write<id_type>(this.id);
    ds.write<time>(this.timestamp);
    ds.write<account_name>(this.host);
    ds.write<u32>(this.office_code);
    ds.write<u32>(this.points_value);
    ds.writeVector<account_name>(this.lucky_dogs);
    ds.write<id_type>(this.current_id);
  }

  deserialize(ds: DataStream): void {
    this.id = ds.read<id_type>();
    this.timestamp = ds.read<time>();
    this.host = ds.read<account_name>();
    this.office_code = ds.read<u32>();
    this.points_value = ds.read<u32>();
    this.lucky_dogs = ds.readVector<account_name>();
    this.current_id = ds.read<id_type>();
  }

  primaryKey(): id_type {
    return this.id;
  }

  increaseId(): id_type {
    this.current_id++;
    return this.current_id;
  }
}

const STAFFTABLE: string = 'staff';
const OFFICETABLE: string = 'office';
const RECORDTABLE: string = 'record';

const ultScope: string = 'ultrain';

@database(Staff, STAFFTABLE)
@database(Office, OFFICETABLE)
@database(LotteryRecord, RECORDTABLE)

class Lottery extends Contract {

  constructor(receiver: account_name) {
    super(receiver);
    this.onInit();
  }

  private static RECORD_PRIMARY_ID: id_type = 0;
  private static RECORD_START: id_type = 1;

  stafftable: DBManager<Staff>;
  officetable: DBManager<Office>;

  public onInit(): void {
      this.stafftable = new DBManager<Staff>(NAME(STAFFTABLE), this.receiver, NAME(ultScope));
      this.officetable = new DBManager<Office>(NAME(OFFICETABLE), this.receiver, NAME(ultScope));
  }

  public onStop(): void {
  }

  @action
  joinUltrain(display_name: string, office_code: u32): void {
    Action.requireAuth(Action.sender);
    ultrain_assert(office_code >= 0 && office_code < 10, 'office code is not within a valid range.');
    let existing1 = this.stafftable.exists(Action.sender);
    ultrain_assert(!existing1, 'Join Ultrain: this guy has joined in ultrain.');

    let person: Staff = new Staff(Action.sender, display_name, office_code);
    person.account = Action.sender;
    person.points = 0;
    person.absent = false;
    person.office = office_code;
    person.name = display_name;
    if (Action.sender == this.receiver) {
      person.permission = 2;
    } else {
      person.permission = 1;
    }

    this.stafftable.emplace(Action.sender, person);

    let officeInfo: Office = new Office(office_code);
    let existing2 = this.officetable.get(office_code, officeInfo);

    officeInfo.office = office_code;
    officeInfo.members.push(Action.sender);
    if (!existing2) {
      this.officetable.emplace(Action.sender, officeInfo);
    } else {
      this.officetable.modify(Action.sender, officeInfo);
    }
  }

  @action
  removeFromUltrain(account: account_name): void {
    Action.requireAuth(Action.sender);
    //check host's permission
    let host: Staff = new Staff(Action.sender);
    let existing1 = this.stafftable.get(Action.sender, host);

    ultrain_assert(existing1, "removeFromUltrain: host account is not existed.");
    if (Action.sender != account && Action.sender != this.receiver) {
      ultrain_assert(host.permission > 0, "Remove from Ultrain: host has no permission to remove member.");
    }

    let office_code: u32 = host.office;
    
    if(Action.sender != account) {
      let person: Staff = new Staff(account);
      let existing2 = this.stafftable.get(account, person);
      ultrain_assert(existing2, "removeFromUltrain: the guy to be removed is not existed.");
      office_code = person.office;
    }
    
    let officeInfo: Office = new Office(office_code);
    let existing3 = this.officetable.get(office_code, officeInfo);

    ultrain_assert(existing3, "removeFromUltrain: exception happened, his/her office is not found");
    this.stafftable.erase(account);

    let idx: u32 = -1;
    for (let i: i32 = 0; i < officeInfo.members.length; ++i) {
      if (officeInfo.members[i] == account) {
        idx = i;
        break;
      }
    }
    officeInfo.members.splice(idx, 1);

    if (officeInfo.members.length > 0) {
      this.officetable.modify(Action.sender, officeInfo);
    } else {
      this.officetable.erase(office_code);
    }
  }

  @action
  setPermission( account: account_name, new_permission: u32): void {
    Action.requireAuth(Action.sender);

    ultrain_assert(new_permission >= 0 && new_permission < 3, "setPermission: invalid permission.");
    let host: Staff = new Staff(Action.sender);
    let existing1 = this.stafftable.get(Action.sender, host);

    ultrain_assert(existing1, "setPermission: host account is not existed.");
    ultrain_assert((host.permission == 2 || Action.sender == this.receiver), "setPermission: host has no permission to set permission for others.");

    let person: Staff = new Staff(account);
    if(Action.sender != account) {
      let existing2 = this.stafftable.get(account, person);
      ultrain_assert(existing2, "setPermission: this guy to update permission is not existed.");
    }
    else {
      person = host;
    }

    person.permission = new_permission;
    this.stafftable.modify(account, person);
  }

  @action
  moveToOffice(office_code: u32): void {
    Action.requireAuth(Action.sender);
    let person: Staff = new Staff(Action.sender, ' ', 0);
    let existing1 = this.stafftable.get(Action.sender, person);

    ultrain_assert(existing1, "moveToOffice: account is not existed.");
    ultrain_assert(office_code != person.office, "moveToOffice: You have already at this office.");
    let previous_office = person.office;
    person.office = office_code;
    this.stafftable.modify(Action.sender, person);

    let officeInfo: Office = new Office(previous_office);
    let existing2 = this.officetable.get(previous_office, officeInfo);
    ultrain_assert(existing2, "moveToOffice: account is not existed in previous office.");

    let idx: u32 = -1;
    for (let i: i32 = 0; i < officeInfo.members.length; ++i) {
      if (officeInfo.members[i] == Action.sender) {
        idx = i;
        break;
      }
    }
    officeInfo.members.splice(idx, 1);

    if (officeInfo.members.length > 0) {
      this.officetable.modify(Action.sender, officeInfo);
    } else {
      this.officetable.erase(previous_office);
    }

    let officeInfo2: Office = new Office(office_code);
    let existing3 = this.officetable.get(office_code, officeInfo2);
    officeInfo2.members.push(Action.sender);

    if (!existing3) {
      this.officetable.emplace(Action.sender, officeInfo2);
    } else {
      this.officetable.modify(Action.sender, officeInfo2);
    }
  }

  @action
  setAbsent(account: account_name): void {
    Action.requireAuth(Action.sender);

    let host: Staff = new Staff(Action.sender);
    let existing1 = this.stafftable.exists(account);

    ultrain_assert(existing1, "setAbsent: host account is not existed.");
    ultrain_assert((host.permission == 2 || Action.sender == this.receiver || Action.sender == Action.receiver),
                   "setAbsent: host has no permission to setPermission for others.");

    let person: Staff = new Staff(account);
    let existing2 = this.stafftable.get(account, person);
    ultrain_assert(existing2, "setAbsent: the guy whose permission need be modified is not existed.");

    person.absent = true;
    this.stafftable.modify(account, person);
  }

  @action
  setPresent(): void {
    Action.requireAuth(Action.sender);

    let person: Staff = new Staff(Action.sender);
    let existing = this.stafftable.get(Action.sender, person);
    ultrain_assert(existing, "setPresent: the guy whose permission need be modified is not existed.");

    person.absent = false;
    this.stafftable.modify(Action.sender, person);
  }

  //@action
  deleteOffice(office_code: u32): void {
    Action.requireAuth(Action.sender);

    ultrain_assert(Action.sender == this.receiver, "deleteOffice: you have no permission to delete office");
    let existing = this.officetable.exists(office_code);
    if(existing) {
      this.officetable.erase(office_code);
    }
  }

  @action
  luckyDraw( office_code: u32, lucky_dog_num: u32 = 2): string {
    Action.requireAuth(Action.sender);

    let points: u32 = 10;
    ultrain_assert(lucky_dog_num > 0 && lucky_dog_num < 5, "luckyDraw: invalid lucky_dog_num.");
    let host: Staff = new Staff(Action.sender);
    let existing1 = this.stafftable.get(Action.sender, host);

    ultrain_assert(existing1, "luckyDraw: host account is not existed.");
    ultrain_assert(host.permission > 0 && host.permission < 3, "luckyDraw: host has no permission to perform luckDraw.");

    let candidates: Array<Staff> = new Array<Staff>();
    let officeInfo: Office = new Office(office_code);
    let existing2 = this.officetable.get(office_code, officeInfo);
    ultrain_assert(existing2, "luckyDraw: office code is not existed.");

    for (let i = 0; i < officeInfo.members.length; i++) {
      let person: Staff = new Staff(officeInfo.members[i]);
      let existing = this.stafftable.get(officeInfo.members[i], person);
      ultrain_assert(existing, "luckyDraw: exception happened, an account is not existed.");
      if (!person.absent) {
        candidates.push(person);
      }
    }

    ultrain_assert(<u32>candidates.length >= lucky_dog_num, "luckyDraw: staffs number in this office is less then the required number");

    if(Action.sender != this.receiver) {
      //this action can only be performed twice per day. one is during 11:00-13:00 and another is during 17:00-19:00

      //1. check the time, restrict the action time during 11:00-13:00 and 17:00-19:00
      let gmtTime: GmtTime = new GmtTime(now());
      let localTime: LocalTime = gmtTime.toLocalTime("+08:00");
      ultrain_assert( (localTime.hours >= 11 && localTime.hours <= 13) || (localTime.hours >= 17 && localTime.hours <= 19),
                     "LuckyDraw can only be performed during 11:00-13:00 or 17:00-19:00 except contract owner.");
      //2. check the interval time between current and last is more then 2 hours.
      let lastTime = this.getTimeOfLastRecord(office_code);
      ultrain_assert( now() - lastTime > 2*60*60, "luckyDraw: This action can not be performed twice within 2 hours.");
    }
    let luckyDogs: Array<Staff> = new Array<Staff>();
    if (<u32>candidates.length == lucky_dog_num) {
      luckyDogs = candidates;
    }
    else {
      let hash = HeadBlock.id;
      ultrain_assert(<u32>hash.length > lucky_dog_num, 'luckyDraw: too many lucky dogs.');
      for (let i = lucky_dog_num; i > 0 && candidates.length > 0; --i) {
        let factor = hash.charCodeAt(<u32>hash.length - i);
        let x = factor % (<u16>candidates.length);
        luckyDogs.push(candidates[x]);
        candidates.splice(x, 1);
      }
    }

    let records: DBManager<LotteryRecord> = new DBManager<LotteryRecord>(NAME(RECORDTABLE), this._receiver, office_code);
    let record: LotteryRecord = new LotteryRecord(office_code);
    record.id = this.availableRecordKey(office_code);
    record.host = Action.sender;
    record.office_code = office_code;
    record.current_id = record.id;
    record.points_value = points;
    record.timestamp = HeadBlock.timestamp; //todo, maybe need to add some seconds
    let returnResult: string = 'Winners are: ';
    for (let i = 0; i < luckyDogs.length; i++) {
      let person: Staff = new Staff(luckyDogs[i].account);
      this.stafftable.get(luckyDogs[i].account, person);
      person.points = person.points + points;
      this.stafftable.modify(luckyDogs[i].account, person);
      record.lucky_dogs.push(luckyDogs[i].account);
      returnResult += RNAME(luckyDogs[i].account);
      returnResult += '(';
      returnResult += luckyDogs[i].name;
      returnResult += ')';
      if(i != luckyDogs.length - 1) {
        returnResult += ', ';
      }
      else {
        returnResult += '.';
      }
    }

    records.emplace(Action.sender, record);
    
    //emit('onLuckyDraw', EventObject.setStringArray('result', lucky_names));

    //set the latest record to id 0;
    let existed = records.exists(Lottery.RECORD_PRIMARY_ID);
    record.current_id = record.id;
    record.id = 0;
    if (!existed) {
      records.emplace(Action.sender, record);
    }
    else {
      records.modify(Action.sender, record);
    }

    Return<string>(returnResult);
    return returnResult;
  }

  @action
  queryLatestRecord(office_code: u32) : string {
    Action.requireAuth(Action.sender);
    let existing = this.stafftable.exists(Action.sender);
    ultrain_assert(existing, "queryLastRecord: account is not existed.");

    let records: DBManager<LotteryRecord> = new DBManager<LotteryRecord>(NAME(RECORDTABLE), this._receiver, office_code);
    let record: LotteryRecord = new LotteryRecord(office_code);
    let existing2 = records.get(Lottery.RECORD_PRIMARY_ID, record);
    let returnResult: string = 'Winners are: ';
    if (existing2) {
      for (let i = 0; i < record.lucky_dogs.length; i++) {
        let person: Staff = new Staff(record.lucky_dogs[i]);
        let existing =  this.stafftable.get(record.lucky_dogs[i], person);
        if(!existing) {
          //maybe this guy has leave ultrain, use account name and mark it with *
          returnResult += '*';
          returnResult += RNAME(record.lucky_dogs[i]);
        }
        else {
          returnResult += RNAME(person.account);
          returnResult += '(';
          returnResult += person.name;
          returnResult += ')';
        }

        if(i != record.lucky_dogs.length - 1) {
          returnResult += ', ';
        }
        else {
          returnResult += '.';
        }
      }
      returnResult += ' performed time: ';
      let gmtTime: GmtTime = new GmtTime(record.timestamp);
      let localTime: LocalTime = gmtTime.toLocalTime("+08:00");
      returnResult += localTime.toString();
    }
    else {
      returnResult = 'No record for this office.';
    }

    //emit('onQuery', EventObject.setStringArray('latest', lucky_names));
    Return<string>(returnResult);

    return returnResult;
  }

  @action
  changeDisplayName(display_name: string): void {
    Action.requireAuth(Action.sender);
    let person: Staff = new Staff(Action.sender);
    let existing1 = this.stafftable.get(Action.sender, person);

    ultrain_assert(existing1, "luckyDraw: host account is not existed.");

    person.name = display_name;
    this.stafftable.modify(Action.sender, person);
  }

  @action
  listPresentStaffs(office_code: u32): string {
    let staffs: Array<Staff> = new Array<Staff>();
    let officeInfo: Office = new Office(office_code);
    let existing = this.officetable.get(office_code, officeInfo);
    ultrain_assert(existing, "listPresentStaffs: office code is not existed.");

    for (let i = 0; i < officeInfo.members.length; i++) {
      let person: Staff = new Staff(officeInfo.members[i]);
      let existing2 = this.stafftable.get(officeInfo.members[i], person);
      ultrain_assert(existing2, "listPresentStaffs: exception happened, an account is not existed.");
      if (!person.absent) {
        staffs.push(person);
      }
    }

    let returnResult: string = 'All present staffs are: '; 
    for (let i = 0; i < staffs.length; i++) {
      returnResult += RNAME(staffs[i].account);
      returnResult += '(';
      returnResult += staffs[i].name;
      returnResult += ')';
      if(i != staffs.length - 1) {
        returnResult += ', ';
      }
      else {
        returnResult += '.';
      }
    }
    Return<string>(returnResult);
    return returnResult;
  }

  @action
  queryPoints(account: account_name) : u32 {
    let person: Staff = new Staff(account);
    let existing = this.stafftable.get(account, person);
    ultrain_assert(existing, "queryPoints: account is not existed.");

    Return<u32>(person.points);
    return person.points;
  }

  private getPresentList(office_code: u32): Array<Staff> {
    let candidates: Array<Staff> = new Array<Staff>();

    let officeInfo: Office = new Office(office_code);
    let existing2 = this.officetable.get(office_code, officeInfo);
    ultrain_assert(existing2, "getPresentList: office code is not existed.");

    for (let i = 0; i < officeInfo.members.length; i++) {
      let person: Staff = new Staff(officeInfo.members[i]);
      let existing = this.stafftable.get(officeInfo.members[i], person);
      ultrain_assert(existing, "getPresentList: exception happened, an account is not existed.");
      if (!person.absent) {
        candidates.push(person);
      }
    }

    return candidates;
  }

  private availableRecordKey(office: u32): id_type {
    let records: DBManager<LotteryRecord> = new DBManager<LotteryRecord>(NAME(RECORDTABLE), this._receiver, office);
    let record: LotteryRecord = new LotteryRecord(office);
    let existing = records.get(Lottery.RECORD_PRIMARY_ID, record);
    let res =  existing ? record.increaseId() : Lottery.RECORD_START;
    return res;
  }

  private getTimeOfLastRecord(office: u32): time {
    let records: DBManager<LotteryRecord> = new DBManager<LotteryRecord>(NAME(RECORDTABLE), this._receiver, office);
    let record: LotteryRecord = new LotteryRecord(office);
    let existing = records.get(Lottery.RECORD_PRIMARY_ID, record);
    let res =  existing ? record.timestamp : 0;
    return res;
  }
}
