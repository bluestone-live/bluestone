export const calcEstimateRepayAmount = (
  loanAmount: number,
  loanInterestRate: number,
) => {
  return loanAmount * (1 + loanInterestRate / 100);
};
