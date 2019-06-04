import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { Account } from '../../stores';
import { observer } from 'mobx-react';

interface IProps extends WithTranslation {
  account: Account;
}

export default observer(
  withTranslation()((props: IProps) => (
    <header>
      BlueStone
      {props.account.accountName}
    </header>
  )),
);
