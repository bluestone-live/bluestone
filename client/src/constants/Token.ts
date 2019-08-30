import { IAnnualPercentageRateValues } from './Rate';
import { Contract } from 'web3-eth-contract';
import { BigNumber } from '../utils/BigNumber';

export const SupportToken = ['ETH', 'DAI', 'USDT'];

export const defaultTokenPairs: {
  [key: string]: string;
} = SupportToken.reduce<{
  [key: string]: string;
}>((acc, currTokenSymbol) => {
  return {
    ...acc,
    [currTokenSymbol]: SupportToken.filter(
      tokenSymbol => tokenSymbol !== currTokenSymbol,
    )[0],
  };
}, {});

export interface IToken {
  symbol: string;
  address: string;
  defaultLoanPair: string;
  loanAnnualPercentageRates?: IAnnualPercentageRateValues;
  logo?: string;
  depositEnabled: boolean;
  price?: BigNumber;
  erc20: Contract;
}
