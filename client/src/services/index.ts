import { AccountService } from './AccountService';
import { MetaMaskProvider } from '../utils/MetaMaskProvider';
import { CommonService } from './CommonService';
import { DepositService } from './DepositService';
import { LoanService } from './LoanService';

const generateService = async () => {
  const provider = new MetaMaskProvider();
  await provider.init();

  return {
    accountService: new AccountService(provider),
    commonService: new CommonService(provider),
    depositService: new DepositService(provider),
    loanService: new LoanService(provider),
  };
};

let promise: Promise<{
  accountService: AccountService;
  commonService: CommonService;
  depositService: DepositService;
  loanService: LoanService;
}>;

export const getService = () => {
  if (!promise) {
    promise = generateService();
  }
  return promise;
};
