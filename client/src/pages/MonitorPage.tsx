import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { PoolAction, useDepositTokens, usePools } from '../stores';
import { getService } from '../services';
import styled from 'styled-components';
import Dropdown, { IDropdownOption } from '../components/common/Dropdown';
import Card from '../components/common/Card';
import { convertWeiToDecimal } from '../utils/BigNumber';

const StyledHeader = styled(Dropdown)`
  width: 100%;
  font-size: 32px;
`;

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

export default () => {
  const dispatch = useDispatch();

  // Selector
  const tokens = useDepositTokens();

  const pools = usePools();
  if (!tokens) {
    return null;
  }

  // Initialize
  useDepsUpdated(async () => {
    const { poolService } = await getService();

    if (tokens.length > 0) {
      tokens.forEach(async token =>
        dispatch(
          PoolAction.replacePools(
            token.tokenAddress,
            await poolService.getDetailsFromAllPools(token.tokenAddress),
          ),
        ),
      );
    }
  }, [tokens]);
  // State
  const [selectedToken, setSelectedToken] = useState();

  useDepsUpdated(async () => {
    setSelectedToken(tokens[0]);
  }, [tokens]);

  // Callback
  const onSelected = useCallback(
    (option: IDropdownOption) => {
      const token = tokens.find(t => t.tokenAddress === option.key);
      if (token) {
        setSelectedToken(token);
      }
    },
    [tokens],
  );

  // Computed
  const selectedPools = useMemo(() => {
    if (!selectedToken || !pools[selectedToken.tokenAddress]) {
      return [];
    }
    return pools[selectedToken.tokenAddress];
  }, [selectedToken, pools]);

  return (
    <div className="monitor">
      <Card>
        <StyledHeader
          options={tokens.map(token => ({
            text: token.tokenSymbol,
            key: token.tokenAddress,
          }))}
          onSelected={onSelected}
        >
          {selectedToken && selectedToken.tokenSymbol}
        </StyledHeader>
      </Card>
      <Card>
        <StyledTable>
          <thead>
            <tr>
              <th>Pool Index</th>
              <th>Pool ID</th>
              <th>Deposit Amount</th>
              <th>Available Amount</th>
              <th>Total Loan Interest</th>
              <th>Total Deposit Weight</th>
            </tr>
          </thead>
          <tbody>
            {selectedPools
              .sort((p1, p2) => p2.poolIndex - p1.poolIndex)
              .map(pool => (
                <tr key={`pool-row-${pool.poolIndex}`}>
                  <td>{pool.poolIndex.toString()}</td>
                  <td>{pool.poolId.toString()}</td>
                  <td>{convertWeiToDecimal(pool.depositAmount)}</td>
                  <td>{convertWeiToDecimal(pool.availableAmount)}</td>
                  <td>{convertWeiToDecimal(pool.loanInterest)}</td>
                  <td>{convertWeiToDecimal(pool.totalDepositWeight)}</td>
                </tr>
              ))}
          </tbody>
        </StyledTable>
      </Card>
    </div>
  );
};
