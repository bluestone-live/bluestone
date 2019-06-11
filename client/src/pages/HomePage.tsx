import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { ConfigurationStore, AccountStore } from '../stores';
import DropDown from '../components/common/Dropdown';

interface IProps {
  configurationStore: ConfigurationStore;
  accountStore: AccountStore;
}

interface ITermOption {
  text: string;
  key: string;
}

interface IState {
  selectedTerm: ITermOption;
}

const terms: ITermOption[] = [
  {
    text: '1 Day',
    key: '1D',
  },
  {
    text: '7 Days',
    key: '7D',
  },
  {
    text: '30 Days',
    key: '30D',
  },
];

@inject('configurationStore', 'accountStore')
@observer
export default class Main extends React.Component<IProps, IState> {
  state = {
    selectedTerm: terms[0],
  };

  onTermSelect = (termOption: ITermOption) =>
    this.setState({
      selectedTerm: termOption,
    });

  render() {
    const { selectedTerm } = this.state;

    return (
      <div className="portal">
        <DropDown options={terms} onSelected={this.onTermSelect}>
          {selectedTerm.text}
        </DropDown>
        <div className="token-list" />
      </div>
    );
  }
}
