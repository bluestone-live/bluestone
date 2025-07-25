import React, { useMemo, useCallback } from 'react';
import {
  useTokenBalance,
  ETHIdentificationAddress,
  useDepositTokens,
  useDefaultAccount,
  AccountActions,
  IToken,
  ViewActions,
  LoadingType,
  useLoadingType,
} from '../stores';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useDispatch } from 'react-redux';
import Table from 'antd/lib/table';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import Button from 'antd/lib/button';

const MintTokenPage = () => {
  const accountAddress = useDefaultAccount();
  const tokens = useDepositTokens();
  const tokenBalance = useTokenBalance();
  const dispatch = useDispatch();
  const loadingType = useLoadingType();

  useDepsUpdated(async () => {
    const { accountService } = await getService();

    if (tokens.length > 0 && accountAddress) {
      tokens.forEach(async token => {
        dispatch(
          AccountActions.setTokenBalance(
            token.tokenAddress,
            token.tokenAddress === ETHIdentificationAddress
              ? await accountService.getETHBalance(accountAddress)
              : await accountService.getTokenBalance(accountAddress, token),
          ),
        );
      });
    }
  }, [tokens, accountAddress]);

  const mintToken = useCallback(
    (token: IToken) => async () => {
      dispatch(ViewActions.setLoadingType(LoadingType.Mint));

      const { accountService } = await getService();
      await accountService.mintToken(
        accountAddress,
        token,
        convertDecimalToWei(1000000, token.decimals),
      );

      dispatch(
        AccountActions.setTokenBalance(
          token.tokenAddress,
          token.tokenAddress === ETHIdentificationAddress
            ? await accountService.getETHBalance(accountAddress)
            : await accountService.getTokenBalance(accountAddress, token),
        ),
      );

      dispatch(ViewActions.setLoadingType(LoadingType.None));
    },
    [tokens],
  );

  const columns = useMemo(
    () => [
      {
        title: 'symbol',
        dataIndex: 'symbol',
        key: 'symbol',
      },
      {
        title: 'balance',
        dataIndex: 'balance',
        key: 'balance',
      },
      {
        title: '',
        key: 'action',
        render: (
          _: any,
          record: { symbol: string; token: IToken; balance: string },
        ) => {
          if (record.symbol !== 'ETH') {
            return (
              <Button
                onClick={mintToken(record.token)}
                disabled={loadingType !== LoadingType.None}
                size="small"
                type="primary"
              >
                Mint
              </Button>
            );
          }
        },
      },
    ],
    [],
  );

  const dataSource = useMemo(
    () =>
      tokens.map(token => {
        const balance = tokenBalance.find(
          b => token.tokenAddress === b.tokenAddress,
        );
        return {
          symbol: token.tokenSymbol,
          token,
          balance: balance
            ? convertWeiToDecimal(balance.balance, 0, token.decimals)
            : '0',
        };
      }),
    [tokens, tokenBalance],
  );

  return (
    <div className="mint-token-page">
      <Table
        rowKey="symbol"
        pagination={false}
        columns={columns}
        dataSource={dataSource}
      />
    </div>
  );
};

export default MintTokenPage;
