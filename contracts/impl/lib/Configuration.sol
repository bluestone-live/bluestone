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
        address payable interestReserveAddress;
        IInterestModel interestModel;
        // Token address -> price oracle
        mapping(address => IPriceOracle) priceOracleByToken;
        IPayableProxy payableProxy;
    }

    event SetPriceOracleSucceed(
        address indexed adminAddress,
        address tokenAddress,
        address priceOracleAddress
    );

    event SetPayableProxySucceed(
        address indexed adminAddress,
        address payableProxyAddress
    );

    event SetProtocolAddressSucceed(
        address indexed adminAddress,
        address interestReserveAddress
    );

    event SetInterestModelSucceed(
        address indexed adminAddress,
        address interestModelAddress
    );

    event SetProtocolReverveRatioSucceed(
        address indexed adminAddress,
        uint256 protocolReserveRatio
    );

    event SetMaxDistributionFeeRatiosSucceed(
        address indexed adminAddress,
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    );

    function setPriceOracle(
        State storage self,
        address tokenAddress,
        IPriceOracle priceOracle
    ) external {
        self.priceOracleByToken[tokenAddress] = priceOracle;

        emit SetPriceOracleSucceed(
            msg.sender,
            tokenAddress,
            address(priceOracle)
        );
    }

    function setPayableProxy(State storage self, IPayableProxy payableProxy)
        external
    {
        self.payableProxy = payableProxy;

        emit SetPayableProxySucceed(msg.sender, address(payableProxy));
    }

    function setInterestReserveAddress(
        State storage self,
        address payable interestReserveAddress
    ) external {
        require(
            interestReserveAddress != address(0),
            'Configuration: invalid protocol address'
        );

        self.interestReserveAddress = interestReserveAddress;

        emit SetProtocolAddressSucceed(msg.sender, interestReserveAddress);
    }

    function setInterestModel(State storage self, IInterestModel interestModel)
        external
    {
        self.interestModel = interestModel;

        emit SetInterestModelSucceed(msg.sender, address(interestModel));
    }

    function setProtocolReserveRatio(
        State storage self,
        uint256 protocolReserveRatio
    ) external {
        self.protocolReserveRatio = protocolReserveRatio;

        emit SetProtocolReverveRatioSucceed(msg.sender, protocolReserveRatio);
    }

    function setMaxDistributorFeeRatios(
        State storage self,
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external {
        self.maxDepositDistributorFeeRatio = maxDepositDistributorFeeRatio;
        self.maxLoanDistributorFeeRatio = maxLoanDistributorFeeRatio;

        emit SetMaxDistributionFeeRatiosSucceed(
            msg.sender,
            maxLoanDistributorFeeRatio,
            maxLoanDistributorFeeRatio
        );
    }
}
