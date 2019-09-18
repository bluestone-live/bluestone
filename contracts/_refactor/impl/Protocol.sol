pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./lib/_Configuration.sol";
import "./lib/_LiquidityPools.sol";
import "./lib/_DepositManager.sol";
import "./lib/_LoanManager.sol";


/// @title Main contract
contract Protocol is Ownable, Pausable {
    using _Configuration for _Configuration.State;
    using _LiquidityPools for _LiquidityPools.State;
    using _DepositManager for _DepositManager.State;
    using _LoanManager for _LoanManager.State;

    _Configuration.State _configuration;
    _LiquidityPools.State _liquidityPools;
    _DepositManager.State _depositManager;
    _LoanManager.State _loanManager;

    event LockUserActions();
    event UnlockUserActions();

    /// --- Deposit ---

    function enableDepositTerm(uint term) external whenNotPaused onlyOwner {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function disableDepositTerm(uint term) external whenNotPaused onlyOwner {
        _depositManager.disableDepositTerm(term);
    }

    function enableDepositToken(address tokenAddress) external whenNotPaused onlyOwner {
        _depositManager.enableDepositToken(_liquidityPools, tokenAddress);
    }

    function disableDepositToken(address tokenAddress) external whenNotPaused onlyOwner {
        _depositManager.disableDepositToken(tokenAddress);
    }

    function updateDepositMaturity() external whenNotPaused onlyOwner {
        _depositManager.updateDepositMaturity(_liquidityPools, _loanManager);
    }

    function getDepositTerms() external whenNotPaused view returns (uint[] memory depositTermList) {
        return _depositManager.enabledDepositTermList;
    }

    function getDepositTokens()
        external
        whenNotPaused
        view
        returns (
            address[] memory depositTokenAddressList,
            bool[] memory isEnabledList
        )
    {
        return _depositManager.getDepositTokens();
    }

    /// --- Loan

    function addLoanTerm(uint loanTerm) external whenNotPaused onlyOwner {
        _loanManager.addLoanTerm(loanTerm);
    }

    function removeLoanTerm(uint loanTerm) external whenNotPaused onlyOwner {
        _loanManager.removeLoanTerm(loanTerm);
    }

    function getLoanTerms() external whenNotPaused view returns (uint[] memory loanTermList) {
        return _loanManager.loanTermList;
    }

    /// --- Configuration ---
    function setPriceOracleAddress(address priceOracleAddress) external whenNotPaused onlyOwner {
        _configuration.setPriceOracleAddress(priceOracleAddress);
    }

    function setProtocolAddress(address protocolAddress) external whenNotPaused onlyOwner {
        _configuration.setProtocolAddress(protocolAddress);
    }

    function setProtocolReserveRatio(uint protocolReserveRatio) external whenNotPaused onlyOwner {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
    }

    function lockUserActions() external whenNotPaused onlyOwner {
        _configuration.lockUserActions();
    }

    function unlockUserActions() external whenNotPaused onlyOwner {
        _configuration.unlockUserActions();
    }

    function getPriceOracleAddress() external whenNotPaused view returns (address priceOracleAddress) {
        return _configuration.priceOracleAddress;
    }

    function getProtocolAddress() external whenNotPaused view returns (address protocolAddress) {
        return _configuration.protocolAddress;
    }

    function getProtocolReserveRatio() external whenNotPaused view returns (uint protocolReserveRatio) {
        return _configuration.protocolReserveRatio;
    }

    function isUserActionsLocked() external view returns (bool isLocked) {
        return _configuration.isUserActionsLocked;
    }
}
