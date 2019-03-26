pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract Loan {
    using SafeMath for uint;

    address private _owner;
    uint8 private _term;
    uint private _loanAmount;
    uint private _collateralAmount;
    uint private _createdAt;
    uint private _updatedAt;

    /// Deposit Term -> Pool Term -> Amount
    /// How much have one loaned from a specific pool (identified by Pool Term) 
    /// in a specific pool group (identified by Deposit Term).
    mapping(uint8 => mapping(uint8 => uint)) private records;

    constructor(address owner, uint8 term, uint loanAmount, uint collateralAmount) public {
        _owner = owner;
        _term = term;
        _loanAmount = loanAmount;
        _collateralAmount = collateralAmount;
        _createdAt = now;
        _updatedAt = now;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function getRecord(uint8 depositTerm, uint8 poolTerm) external view returns (uint) {
        return records[depositTerm][poolTerm];
    }

    function setRecord(uint8 depositTerm, uint8 poolTerm, uint amount) external {
        records[depositTerm][poolTerm] = amount; 
        _updatedAt = now;
    }

    function addCollateral(uint amount) external {
        _collateralAmount = _collateralAmount.add(amount);    
        _updatedAt = now;
    }
}
