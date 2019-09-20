pragma solidity ^0.5.0;

import '../DepositManager.sol';

contract DepositManagerMock is DepositManager {
    Deposit[] public deposits;

    function deposit(address asset, uint256 term, uint256 amount)
        public
        returns (Deposit)
    {
        Deposit currDeposit = super.deposit(asset, term, amount);
        deposits.push(currDeposit);
        return currDeposit;
    }

    function prepareInterestIndexHistory(
        address asset,
        uint256 term,
        uint256 interestIndex,
        uint256 numDays
    ) public {
        for (uint256 i = 0; i < numDays; i++) {
            super._updateInterestIndexHistory(asset, term, interestIndex);
        }
    }

    function updateInterestIndexHistory(
        address asset,
        uint256 term,
        uint256 interestIndex
    ) public {
        super._updateInterestIndexHistory(asset, term, interestIndex);
    }

    function getInterestIndexFromDaysAgo(
        address asset,
        uint256 term,
        uint256 numDaysAgo
    ) public view returns (uint256) {
        return super._getInterestIndexFromDaysAgo(asset, term, numDaysAgo);
    }

    function updateDepositMaturity(address asset) public {
        super._updateDepositMaturity(asset);
    }
}
