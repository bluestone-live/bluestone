pragma solidity ^0.6.7;

import '../../oracle/interface/IPriceOracle.sol';
import '../interface/IInterestModel.sol';


/// @title Protocol configurations
library Configuration {
    struct State {
        // The percentage deposit distributor takes from deposit interest as reward
        uint256 depositDistributorFeeRatio;
        // The percentage loan distributor takes from deposit interest as reward
        uint256 loanDistributorFeeRatio;
        // The percentage protocol takes from deposit interest as profit
        uint256 protocolReserveRatio;
        // The address where the protocol sends earned profit to
        address payable interestReserveAddress;
        // Token address -> price oracle
        mapping(address => IPriceOracle) priceOracleByToken;
        // Token address -> maximum token balance allowed
        mapping(address => uint256) balanceCapByToken;
        IInterestModel interestModel;
    }

    event SetPriceOracleSucceed(
        address indexed adminAddress,
        address tokenAddress,
        address priceOracleAddress
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
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    );

    event SetBalanceCapSucceed(
        address indexed adminAddress,
        address tokenAddress,
        uint256 balanceCap
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
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external {
        self.depositDistributorFeeRatio = depositDistributorFeeRatio;
        self.loanDistributorFeeRatio = loanDistributorFeeRatio;

        emit SetMaxDistributionFeeRatiosSucceed(
            msg.sender,
            loanDistributorFeeRatio,
            loanDistributorFeeRatio
        );
    }

    function setBalanceCap(
        State storage self,
        address tokenAddress,
        uint256 balanceCap
    ) external {
        self.balanceCapByToken[tokenAddress] = balanceCap;

        emit SetBalanceCapSucceed(msg.sender, tokenAddress, balanceCap);
    }
}
