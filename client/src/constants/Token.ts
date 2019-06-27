import { IAnnualPercentageRateValues } from './Rate';

export const SupportToken = ['ETH', 'DAI', 'USDC'];

export interface IToken {
  symbol: string;
  address: string;
  defaultLoanPair: string;
  depositAnnualPercentageRates?: IAnnualPercentageRateValues;
  loanAnnualPercentageRates?: IAnnualPercentageRateValues;
  logo?: string;
  depositEnabled: boolean;
  price?: number;
}
