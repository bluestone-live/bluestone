pragma solidity ^0.6.0;

import '../../oracle/interface/IPriceOracle.sol';
import '../lib/Configuration.sol';
import '../lib/LiquidityPools.sol';
import '../lib/DepositManager.sol';
import '../lib/LoanManager.sol';

contract ConfigurationMock {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;

    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;

    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
    {
        _configuration.setPriceOracle(tokenAddress, priceOracle);
    }

    function setInterestReserveAddress(address payable interestReserveAddress)
        external
    {
        _configuration.setInterestReserveAddress(interestReserveAddress);
    }

    function setProtocolReserveRatio(uint256 protocolReserveRatio) external {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
    }

    function getInterestReserveAddress()
        external
        view
        returns (address interestReserveAddress)
    {
        return _configuration.interestReserveAddress;
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
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external {
        return
            _configuration.setMaxDistributorFeeRatios(
                depositDistributorFeeRatio,
                loanDistributorFeeRatio
            );
    }

    function getMaxDistributorFeeRatios()
        external
        view
        returns (
            uint256 depositDistributorFeeRatio,
            uint256 loanDistributorFeeRatio
        )
    {
        return (
            _configuration.depositDistributorFeeRatio,
            _configuration.loanDistributorFeeRatio
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

    function enableDepositTerm(uint256 term) external {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }
}
