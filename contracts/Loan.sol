pragma solidity ^0.5.0;


contract Loan {
    address private _owner;
    uint8 private _term;
    uint private _loanAmount;
    uint private _collateralAmount;

    /// Deposit Term -> Pool Term -> Amount
    mapping(uint8 => mapping(uint8 => uint)) private records;

    constructor(address owner, uint8 term, uint loanAmount, uint collateralAmount) public {
        _owner = owner;
        _term = term;
        _loanAmount = loanAmount;
        _collateralAmount = collateralAmount;
    }

    function setRecord(uint8 depositTerm, uint8 poolTerm, uint amount) external {
        records[depositTerm][poolTerm] = amount; 
    }
}
