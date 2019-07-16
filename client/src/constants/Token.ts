import { IAnnualPercentageRateValues } from './Rate';
import { Contract } from 'web3-eth-contract';

export const SupportToken = ['ETH', 'DAI', 'USDT'];

export const defaultTokenPairs = SupportToken.reduce((acc, currTokenSymbol) => {
  acc[currTokenSymbol] = SupportToken.filter(
    tokenSymbol => tokenSymbol !== currTokenSymbol,
  )[0];
  return acc;
}, {});

export interface IToken {
  symbol: string;
  address: string;
  defaultLoanPair: string;
  depositAnnualPercentageRates?: IAnnualPercentageRateValues;
  loanAnnualPercentageRates?: IAnnualPercentageRateValues;
  logo?: string;
  depositEnabled: boolean;
  price?: number;
  erc20: Contract;
}
