import { observable, action } from 'mobx';
import {
  isUserActionsLocked,
  listenUserActionsLockChangeEvent,
} from './services/ConfigurationService';

export class ConfigurationStore {
  @observable isUserActionsLocked: boolean = false;

  @action.bound
  async getIfUserActionsLocked() {
    const res = await isUserActionsLocked();
    return this.setUserActionsLock(res);
  }

  @action.bound
  setUserActionsLock(locked: boolean, triggerByEvent: boolean = false) {
    if (triggerByEvent && locked !== this.isUserActionsLocked) {
      setTimeout(() => {
        window.location.reload();
      }, 0);
    }

    this.isUserActionsLocked = locked;
  }

  @action.bound
  listenUserActionsLockChangeEvent() {
    listenUserActionsLockChangeEvent(this.setUserActionsLock);
  }
}
