pragma solidity ^0.5.0;


contract Term {
    modifier validDepositTerm(uint8 term) {
        require(term == 1 || term == 7 || term == 30, "Valid deposit terms are 1, 7 and 30.");
        _;
    }
    
    modifier validLoanTerm(uint8 term) {
        require(term == 1 || term == 3 || term == 7 || term == 30, "Valid loan terms are 1, 3, 7 and 30.");
        _;
    }
}
