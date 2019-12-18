pragma solidity ^0.5.0;

import '../../interface/IInterestModel.sol';
import '../../interface/IPriceOracle.sol';

library Configuration {
    struct State {
        uint256 maxDepositDistributorFeeRatio;
        uint256 maxLoanDistributorFeeRatio;
        // The percentage protocol takes from deposit interest as reserve.
        uint256 protocolReserveRatio;
        address protocolAddress;
        IInterestModel interestModel;
        // Token address -> price oracle
        mapping(address => IPriceOracle) priceOracleByToken;
    }

    function setPriceOracle(
        State storage self,
        address tokenAddress,
        IPriceOracle priceOracle
    ) external {
        self.priceOracleByToken[tokenAddress] = priceOracle;
    }

    function setProtocolAddress(State storage self, address protocolAddress)
        external
    {
        require(
            protocolAddress != address(0),
            'Configuration: invalid protocol address'
        );

        self.protocolAddress = protocolAddress;
    }

    function setInterestModel(State storage self, IInterestModel interestModel)
        external
    {
        self.interestModel = interestModel;
    }

    function setProtocolReserveRatio(
        State storage self,
        uint256 protocolReserveRatio
    ) external {
        self.protocolReserveRatio = protocolReserveRatio;
    }

    function setMaxDistributorFeeRatios(
        State storage self,
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external {
        self.maxDepositDistributorFeeRatio = maxDepositDistributorFeeRatio;
        self.maxLoanDistributorFeeRatio = maxLoanDistributorFeeRatio;
    }
}
