import React, { useState, useMemo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { Icon } from 'antd';
import {
  useDefaultAccount,
  CommonActions,
  IToken,
  AccountActions,
} from '../stores';
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';
import parseQuery from '../utils/parseQuery';
import { decodeDistributorConfig } from '../utils/decodeDistributorConfig';
import { convertWeiToDecimal } from '../utils/BigNumber';
import TabBar, { TabType } from '../components/TabBar';

interface IProps extends WithTranslation, RouteComponentProps {
  children: React.ReactChild;
  title?: React.ReactChild | React.ReactChild[];
}

const DefaultLayout = (props: IProps) => {
  const {
    children,
    history,
    location: { search },
    t,
  } = props;
  const dispatch = useDispatch();
  const enableEthereumNetwork = async () => {
    const { commonService } = await getService();
    await commonService.enableEthereumNetwork();
  };
  const getAccounts = async () => {
    const { accountService } = await getService();
    const accounts = await accountService.getAccounts();
    dispatch(AccountActions.setAccounts(accounts));
    return accounts;
  };

  // Selector
  const defaultAccount = useDefaultAccount();

  // State
  const [selectedTabType] = useState(TabType.Deposit);

  const tabOptions = useMemo(
    () => [
      {
        title: t('layout_default_deposit'),
        type: TabType.Deposit,
        icon: <Icon type="up" />,
        content: children,
      },
      {
        title: t('layout_default_borrow'),
        type: TabType.Deposit,
        icon: <Icon type="down" />,
        content: children,
      },
      {
        title: t('layout_default_account'),
        type: TabType.Deposit,
        icon: <Icon type="ellipsis" />,
        content: children,
      },
    ],
    [children],
  );

  // Initialize
  useComponentMounted(async () => {
    const { dconfig } = parseQuery(search);

    const { commonService } = await getService();

    await enableEthereumNetwork();
    const accounts = await getAccounts();

    // Bind account and network change event
    commonService.bindEthereumStateChangeEvent(getAccounts, () => {
      window.location.reload();
    });

    const protocolContractAddress = await commonService.getProtocolContractAddress();
    dispatch(CommonActions.setProtocolContractAddress(protocolContractAddress));

    // Get distributor configs
    const protocolAddress = await commonService.getProtocolAddress();

    const distributorFeeRatios = await commonService.getMaxDistributorFeeRatios();
    const distributorConfig = decodeDistributorConfig(dconfig || btoa('{}'));

    if (distributorFeeRatios) {
      dispatch(
        CommonActions.setDistributorConfig({
          address: distributorConfig.address || protocolAddress,
          depositFee: Math.min(
            Number.parseFloat(
              convertWeiToDecimal(
                distributorFeeRatios.maxDepositDistributorFeeRatio,
              ),
            ),
            distributorConfig.depositFee,
          ),
        }),
      );
    }

    // Get deposit terms
    dispatch(
      CommonActions.setDepositTerms(await commonService.getDepositTerms()),
    );

    // Get deposit tokens
    const depositTokens = await Promise.all(
      (await commonService.getDepositTokens()).map(async (token: IToken) => ({
        ...token,
        allowance: await commonService.getTokenAllowance(
          token,
          accounts[0],
          protocolContractAddress,
        ),
      })),
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
              },
              collateralToken: {
                ...collateralToken,
                price: collateralTokenPrice,
              },
              maxLoanTerm,
              annualPercentageRate,
            };
          }),
        ),
      ),
    );
  });

  return <div className="layout default" />;
};

export default withTranslation()(withRouter(DefaultLayout));
