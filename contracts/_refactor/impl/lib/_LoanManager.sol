pragma solidity ^0.5.0;

// TODO(desmond): remove `_` after contract refactor is complete.
library _LoanManager {
    struct State {
        uint256[] loanTermList;
        mapping(uint256 => bool) isLoanTermValid;
    }

    function addLoanTerm(State storage self, uint256 loanTerm) external {
        require(
            !self.isLoanTermValid[loanTerm],
            'LoanManager: term already exists'
        );

        self.loanTermList.push(loanTerm);
        self.isLoanTermValid[loanTerm] = true;

        // TODO(desmond): update totalLoanableAmountPerTerm for each deposit asset and deposit term

    }

    function removeLoanTerm(State storage self, uint256 loanTerm) external {
        require(
            self.isLoanTermValid[loanTerm],
            'LoanManager: term does not exist'
        );

        self.isLoanTermValid[loanTerm] = false;

        for (uint256 i = 0; i < self.loanTermList.length; i++) {
            if (self.loanTermList[i] == loanTerm) {
                // Overwrite current term with the last term
                self.loanTermList[i] = self.loanTermList[self
                        .loanTermList
                        .length -
                    1];

                // Shrink array size
                delete self.loanTermList[self.loanTermList.length - 1];
                self.loanTermList.length--;
            }
        }
    }
}
