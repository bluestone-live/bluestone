pragma solidity ^0.6.0;

import '../impl/lib/Configuration.sol';
import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/DepositManager.sol';
import '../impl/lib/LoanManager.sol';
import '../impl/lib/AccountManager.sol';
import '../interface/IPriceOracle.sol';

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

    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
    {
        _configuration.setPriceOracle(tokenAddress, priceOracle);
    }

    function setProtocolAddress(address payable protocolAddress) external {
        _configuration.setProtocolAddress(protocolAddress);
    }

    function setProtocolReserveRatio(uint256 protocolReserveRatio) external {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
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

    function getPriceOracleAddress(address tokenAddress)
        external
        view
        returns (address priceOracleAddress)
    {
        return address(_configuration.priceOracleByToken[tokenAddress]);
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

    function setPayableProxy(IPayableProxy payableProxy) external {
        _configuration.setPayableProxy(payableProxy);
        ERC20(payableProxy.getWETHAddress()).approve(
            address(payableProxy),
            uint256(-1)
        );
    }

    function getPayableProxy()
        external
        view
        returns (address payableProxyAddress)
    {
        return address(_configuration.payableProxy);
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
