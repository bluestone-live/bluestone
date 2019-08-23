pragma solidity ^0.5.0;

import "../DepositManager.sol";


contract DepositManagerMock is DepositManager {
    Deposit[] public deposits;

    function deposit(address asset, uint term, uint amount) public returns (Deposit) {
        Deposit currDeposit = super.deposit(asset, term, amount);
        deposits.push(currDeposit);
        return currDeposit;
    }

    function prepareInterestIndexHistory(address asset, uint term, uint interestIndex, uint numDays) public {
        for (uint i = 0; i < numDays; i++) {
            super._updateInterestIndexHistory(asset, term, interestIndex);
        }
    } 

    function updateInterestIndexHistory(address asset, uint term, uint interestIndex) public {
        super._updateInterestIndexHistory(asset, term, interestIndex);
    } 

    function getInterestIndexFromDaysAgo(address asset, uint term, uint numDaysAgo) public view returns (uint) {
        return super._getInterestIndexFromDaysAgo(asset, term, numDaysAgo);
    }
}
