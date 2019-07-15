pragma solidity ^0.5.0;


contract Term {
    modifier validDepositTerm(uint8 term) {
        require(term == 1 || term == 30, "Invalid deposit term.");
        _;
    }
    
    modifier validLoanTerm(uint8 term) {
        require(term == 1 || term == 30, "Invalid loan term.");
        _;
    }
}
