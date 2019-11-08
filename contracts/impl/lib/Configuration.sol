pragma solidity ^0.5.0;

import '../../interface/IInterestModel.sol';

library Configuration {
    struct State {
        uint256 maxDepositDistributorFeeRatio;
        uint256 maxLoanDistributorFeeRatio;
        // The percentage protocol takes from deposit interest as reserve.
        uint256 protocolReserveRatio;
        // Lock all functionalities related to deposit, loan and liquidating.
        bool isUserActionsLocked;
        address protocolAddress;
        address priceOracleAddress;
        IInterestModel interestModel;
    }

    event LockUserActions();
    event UnlockUserActions();

    function setPriceOracleAddress(
        State storage self,
        address priceOracleAddress
    ) external {
        require(
            priceOracleAddress != address(0),
            'Configuration: invalid price oracle address'
        );

        self.priceOracleAddress = priceOracleAddress;
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

    function lockUserActions(State storage self) external {
        self.isUserActionsLocked = true;
        emit LockUserActions();
    }

    function unlockUserActions(State storage self) external {
        self.isUserActionsLocked = false;
        emit UnlockUserActions();
    }
}
