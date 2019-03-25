pragma solidity ^0.5.0;


contract Loan {
    address private _owner;
    uint8 private _term;
    uint private _loanAmount;
    uint private _collateralAmount;

    /// Deposit Term -> Pool Term -> Amount
    /// How much have one loaned from a specific pool (identified by Pool Term) 
    /// in a specific pool group (identified by Deposit Term).
    mapping(uint8 => mapping(uint8 => uint)) private records;

    constructor(address owner, uint8 term, uint loanAmount, uint collateralAmount) public {
        _owner = owner;
        _term = term;
        _loanAmount = loanAmount;
        _collateralAmount = collateralAmount;
    }

    function getRecord(uint8 depositTerm, uint8 poolTerm) external view returns (uint) {
        return records[depositTerm][poolTerm];
    }

    function setRecord(uint8 depositTerm, uint8 poolTerm, uint amount) external {
        records[depositTerm][poolTerm] = amount; 
    }
}
