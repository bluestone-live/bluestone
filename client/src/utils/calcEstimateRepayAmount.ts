export const calcEstimateRepayAmount = (
  loanAmount: number,
  selectedLoanTerm: number,
  loanInterestRate: number,
) => {
  return loanAmount * (1 + (loanInterestRate / 365) * selectedLoanTerm);
};
