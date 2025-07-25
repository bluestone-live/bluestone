import React, { useMemo } from 'react';
import { useComponentMounted } from '../utils/useEffectAsync';
import { parseQuery } from '../utils/parseQuery';
import { getService } from '../services';
import { Dispatch } from 'redux';
import {
  AccountActions,
  CommonActions,
  IToken,
  ETHIdentificationAddress,
  ViewActions,
} from '../stores';
import { decodeDistributorConfig } from '../utils/decodeDistributorConfig';
import { TFunction } from 'i18next';
import { TabType } from '../components/TabBar';
import CustomIcon from '../components/CustomIcon';

export const useGlobalInit = (
  pathname: string,
  search: string,
  dispatch: Dispatch,
  t: TFunction,
) => {
  useComponentMounted(async () => {
    const { dconfig } = parseQuery(search);

    const { accountService, commonService } = await getService();

    await commonService.enableEthereumNetwork();
    const getAccounts = async () => {
      const availableAccounts = await accountService.getAccounts();
      dispatch(AccountActions.setAccounts(availableAccounts));
      return availableAccounts;
    };

    const accounts = await getAccounts();

    // Set network
    dispatch(ViewActions.setNetwork(await commonService.getCurrentNetwork()));

    // Bind account and network change event
    commonService.bindEthereumStateChangeEvent(getAccounts);

    const protocolContractAddress = await commonService.getProtocolContractAddress();
    dispatch(CommonActions.setProtocolContractAddress(protocolContractAddress));

    // Get distributor configs
    const interestReserveAddress = await commonService.getInterestReserveAddress();

    const distributorConfig = decodeDistributorConfig(dconfig || btoa('{}'));

    dispatch(
      CommonActions.setDistributorAddress(
        distributorConfig.address || interestReserveAddress,
      ),
    );

    // Get deposit terms
    dispatch(
      CommonActions.setDepositTerms(await commonService.getDepositTerms()),
    );

    // Get deposit tokens
    const depositTokens = await Promise.all(
      (await commonService.getDepositTokens())
        .filter(token => token.tokenAddress !== ETHIdentificationAddress)
        .map(async (token: IToken) => {
          return {
            ...token,
            allowance: await commonService.getTokenAllowance(
              token,
              accounts[0],
              protocolContractAddress,
            ),
          };
        }),
    );
    dispatch(CommonActions.setDepositTokens(depositTokens));

    // Get loan pairs
    const loanAndCollateralTokenPairs = await commonService.getLoanAndCollateralTokenPairs();
    dispatch(
      CommonActions.setLoanPairs(
        await Promise.all(
          loanAndCollateralTokenPairs.map(async pair => {
            const { loanToken, collateralToken } = pair;
            const maxLoanTerm = await commonService.getMaxLoanTerm(
              pair.loanToken.tokenAddress,
            );
            const annualPercentageRate = await commonService.getLoanInterestRate(
              pair.loanToken.tokenAddress,
              maxLoanTerm,
            );
            const loanTokenPrice = await commonService.getPrice(
              loanToken.tokenAddress,
            );
            const collateralTokenPrice = await commonService.getPrice(
              collateralToken.tokenAddress,
            );
            return {
              ...pair,
              loanToken: {
                ...loanToken,
                price: loanTokenPrice,
                allowance:
                  loanToken.tokenAddress === ETHIdentificationAddress
                    ? undefined
                    : await commonService.getTokenAllowance(
                        loanToken,
                        accounts[0],
                        protocolContractAddress,
                      ),
              },
              collateralToken: {
                ...collateralToken,
                price: collateralTokenPrice,
                allowance:
                  collateralToken.tokenAddress === ETHIdentificationAddress
                    ? undefined
                    : await commonService.getTokenAllowance(
                        collateralToken,
                        accounts[0],
                        protocolContractAddress,
                      ),
              },
              maxLoanTerm,
              annualPercentageRate,
            };
          }),
        ),
      ),
    );
  });

  const tabOptions = useMemo(
    () => [
      {
        title: t('layout_default_deposit'),
        type: TabType.Deposit,
        pathTester: /^\/deposit/,
        icon: <CustomIcon type="deposit" />,
      },
      {
        title: t('layout_default_borrow'),
        type: TabType.Borrow,
        pathTester: /^\/borrow/,
        icon: <CustomIcon type="borrow" />,
      },
      {
        title: t('layout_default_account'),
        type: TabType.Account,
        pathTester: /^\/account/,
        icon: <CustomIcon type="account" />,
      },
    ],
    [],
  );

  const selectedTab = useMemo(() => {
    return tabOptions.find(option => {
      return option.pathTester.test(pathname);
    });
  }, [tabOptions, pathname]);

  return { tabOptions, selectedTab };
};
