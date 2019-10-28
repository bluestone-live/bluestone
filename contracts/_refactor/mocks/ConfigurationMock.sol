pragma solidity ^0.5.0;

import '../impl/lib/_Configuration.sol';

contract ConfigurationMock {
    using _Configuration for _Configuration.State;

    _Configuration.State _configuration;

    function setPriceOracleAddress(address priceOracleAddress) external {
        _configuration.setPriceOracleAddress(priceOracleAddress);
    }

    function setProtocolAddress(address protocolAddress) external {
        _configuration.setProtocolAddress(protocolAddress);
    }

    function setProtocolReserveRatio(uint256 protocolReserveRatio) external {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
    }

    function lockUserActions() external {
        _configuration.lockUserActions();
    }

    function unlockUserActions() external {
        _configuration.unlockUserActions();
    }

    function getProtocolAddress()
        external
        view
        returns (address protocolAddress)
    {
        return _configuration.protocolAddress;
    }

    function getProtocolReserveRatio()
        external
        view
        returns (uint256 protocolReserveRatio)
    {
        return _configuration.protocolReserveRatio;
    }

    function isUserActionsLocked() external view returns (bool isLocked) {
        return _configuration.isUserActionsLocked;
    }

    function getPriceOracleAddress()
        external
        view
        returns (address priceOracleAddress)
    {
        return _configuration.priceOracleAddress;
    }

    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external {
        return
            _configuration.setMaxDistributorFeeRatios(
                maxDepositDistributorFeeRatio,
                maxLoanDistributorFeeRatio
            );
    }

    function getMaxDistributorFeeRatios()
        external
        view
        returns (
            uint256 maxDepositDistributorFeeRatio,
            uint256 maxLoanDistributorFeeRatio
        )
    {
        return (
            _configuration.maxDepositDistributorFeeRatio,
            _configuration.maxLoanDistributorFeeRatio
        );
    }

}
