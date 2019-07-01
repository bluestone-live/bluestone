import { observable, action } from 'mobx';
import { uniqBy } from 'lodash';
import { IActionLog } from '../constants/ActionLog';

// maybe we should to scan the chain to get action logs

export class ActionLogStore {
  @observable actionLogs: IActionLog[] = [];

  @action.bound
  appendActionLogs(actionLogs: IActionLog[]) {
    this.actionLogs = uniqBy([...this.actionLogs, ...actionLogs], 'txid');
  }

  @action.bound
  async getActionLogs() {
    // TODO get action logs
  }
}
