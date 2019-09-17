import * as React from 'react';
import { observer, inject } from 'mobx-react';
import {
  LiquidityPoolsStore,
  TokenStore,
  DepositManagerStore,
} from '../stores';
import { IToken } from '../constants/Token';
import styled from 'styled-components';
import Dropdown, { IDropdownOption } from '../components/common/Dropdown';
import Card from '../components/common/Card';
import { BigNumber, convertWeiToDecimal } from '../utils/BigNumber';

interface IProps {
  tokenStore: TokenStore;
  liquidityPoolsStore: LiquidityPoolsStore;
  depositManagerStore: DepositManagerStore;
}

interface IPools {
  [token: string]: Array<{
    poolId: number;
    deposit: string;
    loanableAmount: string;
    loanInterest: string;
  }>;
}

interface IState {
  selectedToken: IToken;
  pools?: IPools;
}

const StyledHeader = styled(Dropdown)`
  width: 100%;
  font-size: 32px;
`;

const range = (num: number) => Array.from(new Array(num)).map((_, i) => i);

const StyledTable = styled.table`
  width: 100%;

  th {
    text-align: right;
    padding: 6px 0;
  }

  td {
    text-align: right;
    padding: 6px 0;
    border-bottom: 1px solid #333;
  }
`;

@inject('tokenStore', 'liquidityPoolsStore', 'depositManagerStore')
@observer
class MonitorPage extends React.Component<IProps, IState> {
  async componentDidMount() {
    const { depositManagerStore, tokenStore } = this.props;
    tokenStore.validTokens.forEach(token => {
      depositManagerStore.depositTerms.forEach(async term => {
        await this.getPoolGroup(token.symbol, term.value);
      });
    });
  }

  state = {
    selectedToken: this.props.tokenStore.validTokens[0],
    pools: undefined,
  };

  onSelected = (option: IDropdownOption) => {
    const { tokenStore } = this.props;

    const token = tokenStore.getTokenByAddress(option.key);
    if (!token) {
      return;
    }

    this.setState({
      selectedToken: token,
    });
  };

  getPoolGroup = async (tokenSymbol: string, term: number) => {
    const { liquidityPoolsStore } = this.props;
    const poolGroup = await liquidityPoolsStore.getPoolGroup(
      tokenSymbol,
      new BigNumber(term),
    );
    return Promise.all(
      range(term).map(async (poolIndex: number) => {
        const poolId = await poolGroup!.methods.poolIds(poolIndex).call();
        const pool = await poolGroup!.methods.poolsById(poolId).call();
        return [poolId, pool];
      }),
    ).then(pools => {
      this.setState({
        pools: {
          ...(this.state.pools || {}),
          [tokenSymbol]: pools.map(([poolId, pool]) => ({
            poolId: Number.parseFloat(poolId.toString()),
            deposit: convertWeiToDecimal(pool.deposit),
            loanInterest: convertWeiToDecimal(pool.loanInterest),
            loanableAmount: convertWeiToDecimal(pool.loanableAmount),
          })),
        },
      });
    });
  };

  render() {
    const { tokenStore } = this.props;
    const { selectedToken } = this.state;

    if (!this.state.pools) {
      return null;
    }

    const pools = (this.state.pools! as IPools)[selectedToken.symbol];

    return (
      <div className="monitor">
        <Card>
          <StyledHeader
            options={tokenStore.validTokens.map(token => ({
              text: token.symbol,
              key: token.address,
            }))}
            onSelected={this.onSelected}
          >
            {selectedToken.symbol}
          </StyledHeader>
        </Card>
        <Card>
          <StyledTable>
            <thead>
              <tr>
                <th>Pool ID</th>
                <th>Deposit Amount</th>
                <th>Loanable Amount</th>
                <th>Loan Interest</th>
                <th>Loan Interest Index</th>
              </tr>
            </thead>
            <tbody>
              {pools.map(pool => (
                <tr key={`pool-row-${pool.poolId}`}>
                  <td>{pool.poolId}</td>
                  <td>{pool.deposit}</td>
                  <td>{pool.loanableAmount}</td>
                  <td>{pool.loanInterest}</td>
                  <td>
                    {Number.parseFloat(pool.deposit) !== 0
                      ? (
                          (Number.parseFloat(pool.loanInterest) /
                            Number.parseFloat(pool.deposit)) *
                          100
                        ).toFixed(4)
                      : '-.--'}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </Card>
      </div>
    );
  }
}

export default MonitorPage;
