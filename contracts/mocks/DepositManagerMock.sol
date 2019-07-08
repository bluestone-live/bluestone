pragma solidity ^0.5.0;

import "../DepositManager.sol";
import "../Configuration.sol";
import "../PriceOracle.sol";
import "../TokenManager.sol";
import "../LiquidityPools.sol";


contract DepositManagerMock is DepositManager {
    Deposit[] public deposits;

    constructor(
        Configuration config,
        PriceOracle priceOracle,
        TokenManager tokenManager,
        LiquidityPools liquidityPools
    ) 
        DepositManager(config, priceOracle, tokenManager, liquidityPools)
        public 
    {}

    function deposit(address asset, uint8 term, uint amount, bool isRecurring) public returns (Deposit) {
        Deposit currDeposit = super.deposit(asset, term, amount, isRecurring);
        deposits.push(currDeposit);
        return currDeposit;
    }

    function calculateInterestRate(address asset, uint8 depositTerm) public view returns (uint) {
        return super._calculateInterestRate(asset, depositTerm);
    }

    function prepareInterestIndexHistory(address asset, uint8 term, uint interestIndex, uint numDays) public {
        for (uint i = 0; i < numDays; i++) {
            super._updateInterestIndexHistory(asset, term, interestIndex);
        }
    } 

    function updateInterestIndexHistory(address asset, uint8 term, uint interestIndex) public {
        super._updateInterestIndexHistory(asset, term, interestIndex);
    } 

    function getInterestIndexFromDaysAgo(address asset, uint8 term, uint numDaysAgo) public view returns (uint) {
        return super._getInterestIndexFromDaysAgo(asset, term, numDaysAgo);
    }
}
