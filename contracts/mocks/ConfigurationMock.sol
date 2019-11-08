pragma solidity ^0.5.0;

import '../impl/lib/Configuration.sol';
import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/DepositManager.sol';
import '../impl/lib/LoanManager.sol';
import '../impl/lib/AccountManager.sol';

contract ConfigurationMock {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;
    using AccountManager for AccountManager.State;

    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;
    AccountManager.State _accountManager;
    LoanManager.LoanParameters _loanParameters;
    DepositManager.DepositParameters _depositParameters;

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

    // -- Helpers --

    function enableDepositToken(address tokenAddress) external {
        _depositManager.enableDepositToken(_liquidityPools, tokenAddress);
    }

    function enableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        _loanManager.enableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function enableDepositTerm(uint256 term) external {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }
}
