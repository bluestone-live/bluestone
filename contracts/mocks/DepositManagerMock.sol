pragma solidity ^0.5.0;

import "../DepositManager.sol";


contract DepositManagerMock is DepositManager {
    constructor(address config, address priceOracle, address tokenManager, address liquidityPools) 
        DepositManager(config, priceOracle, tokenManager, liquidityPools)
        public 
    {}

    function calculateInterestRate(address asset, uint8 depositTerm) public view returns (uint) {
        return super._calculateInterestRate(asset, depositTerm);
    }
}
