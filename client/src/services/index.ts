import 'reflect-metadata';
import { BigNumber } from '../utils/BigNumber';
import { AccountService } from './AccountService';
import { MetaMaskProvider } from '../utils/MetaMaskProvider';
import { CommonService } from './CommonService';
import { DepositService } from './DepositService';
import { LoanService } from './LoanService';

export interface IProtocolDepositRecord {
  depositId: string;
  tokenAddress: string;
  depositTerm: BigNumber;
  depositAmount: BigNumber;
  interest?: BigNumber;
  poolId: BigNumber;
  createdAt: BigNumber;
  maturedAt: BigNumber;
  withdrewAt: BigNumber;
  isMatured?: boolean;
  isWithdrawn?: boolean;
  isEarlyWithdrawable?: boolean;
}

export interface IProtocolLoanRecord {
  loanId: string;
  loanTokenAddress: string;
  collateralTokenAddress: string;
  loanTerm: BigNumber;
  collateralAmount?: BigNumber;
  createdAt: BigNumber;
  remainingDebt: BigNumber;
  currentCollateralRatio?: BigNumber;
  isLiquidatable?: boolean;
  isOverDue?: boolean;
  isClosed: boolean;
}

export const getService = async () => {
  const provider = new MetaMaskProvider();
  await provider.init();

  return {
    accountService: new AccountService(provider),
    commonService: new CommonService(provider),
    depositService: new DepositService(provider),
    loanService: new LoanService(provider),
  };
};
