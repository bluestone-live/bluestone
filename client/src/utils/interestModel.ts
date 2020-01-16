import { BigNumber, convertWeiToDecimal } from './BigNumber';

export const getLoanInterestRate = (
  lowerBound: string,
  upperBound: string,
  loanTerm: string,
  maxLoanTerm: string,
) => {
  const H = new BigNumber(upperBound);
  const L = new BigNumber(lowerBound);

  return convertWeiToDecimal(
    H.sub(
      H.sub(L)
        .mul(new BigNumber(loanTerm))
        .div(new BigNumber(maxLoanTerm)),
    ),
  );
};

export const getLoanInterestRates = (
  lowerBound: string,
  upperBound: string,
  loanTerm: string,
  maxLoanTerm: string,
) => {
  const interests = Array.from(
    new Array(
      Number.parseInt(maxLoanTerm + 1, 10) - Number.parseInt(loanTerm, 10),
    ),
  )
    .map((_, i) => i + Number.parseInt(loanTerm, 10))
    .map((term: number) =>
      getLoanInterestRate(lowerBound, upperBound, term.toString(), maxLoanTerm),
    );

  return interests;
};
