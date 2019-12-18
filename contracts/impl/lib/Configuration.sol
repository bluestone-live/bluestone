pragma solidity ^0.6.0;

import '../../interface/IInterestModel.sol';
import '../../interface/IPriceOracle.sol';
import '../../interface/IPayableProxy.sol';

library Configuration {
    struct State {
        uint256 maxDepositDistributorFeeRatio;
        uint256 maxLoanDistributorFeeRatio;
        // The percentage protocol takes from deposit interest as reserve.
        uint256 protocolReserveRatio;
        address payable protocolAddress;
        IInterestModel interestModel;
        // Token address -> price oracle
        mapping(address => IPriceOracle) priceOracleByToken;
        IPayableProxy payableProxy;
    }

    function setPriceOracle(
        State storage self,
        address tokenAddress,
        IPriceOracle priceOracle
    ) external {
        self.priceOracleByToken[tokenAddress] = priceOracle;
    }

    function setPayableProxy(State storage self, IPayableProxy payableProxy)
        external
    {
        self.payableProxy = payableProxy;
    }

    function setProtocolAddress(
        State storage self,
        address payable protocolAddress
    ) external {
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
