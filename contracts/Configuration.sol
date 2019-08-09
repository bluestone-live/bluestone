pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Term.sol";


// Stores and retrieves business configurations. 
contract Configuration is Ownable, Term {
    uint private constant MIN_COLLATERAL_RATIO = 12 * (10 ** 17); // 1.2 (120%)
    uint private constant MAX_LIQUIDATION_DISCOUNT = 5 * (10 ** 16); // 0.05 (5%)
    uint private constant MAX_PROFIT_RATIO = 3 * (10 ** 17); // 0.3 (30%)

    // loan asset address -> collateral asset address -> collteral ratio 
    mapping(address => mapping(address => uint)) private _collateralRatioMap;

    // loan asset address -> collateral asset address -> liquidation discount
    mapping(address => mapping(address => uint)) private _liquidationDiscountMap;

    // loan asset address -> loan term -> loan annual interest rate
    mapping(address => mapping(uint8 => uint)) private _loanInterestRates;

    /// loan asset address -> deposit term -> loan term -> coeffcient
    /// Coefficent `a` defines how much percentage of the loan should be 
    /// borrowed from a particular PoolGroup.
    /// 
    /// If we use `a_<depositTerm>_<loanTerm>` to represent an coefficent, 
    /// then, for example, when a 1-day loan of 10 ETH is made, 
    /// the coefficent distribution could look like this:
    /// - 50% of the loan draws from 1-day PoolGroup (a_1_1 = 0.5)
    /// - 30% of the loan draws from 7-day PoolGroup (a_7_1 = 0.3)
    /// - 20% of the loan draws from 30-day PoolGroup (a_30_1 = 0.2)
    mapping(address => mapping(uint8 => mapping(uint8 => uint))) private _coefficients;

    // The percentage we take from deposit interest as profit
    uint private _profitRatio = 15 * (10 ** 16); // 0.15 (15%)

    // Shareholder address which receives profit
    address private _shareholderAddress;

    // Lock all functionalities related to deposit, loan and liquidating
    bool private _isUserActionsLocked;

    function getCoefficient(address asset, uint8 depositTerm, uint8 loanTerm) 
        external
        view
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm)
        returns (uint)
    {
        return _coefficients[asset][depositTerm][loanTerm];
    }

    function getCollateralRatio(address loanAsset, address collateralAsset) external view returns (uint) {
        return _collateralRatioMap[loanAsset][collateralAsset];
    } 

    function getLiquidationDiscount(address loanAsset, address collateralAsset) external view returns (uint) {
        return _liquidationDiscountMap[loanAsset][collateralAsset];
    } 

    function getLoanInterestRate(address asset, uint8 loanTerm) external view validLoanTerm(loanTerm) returns (uint) {
        return _loanInterestRates[asset][loanTerm];
    }

    function getProfitRatio() external view returns (uint) {
        return _profitRatio;
    }

    function getShareholderAddress() external view returns (address) {
        return _shareholderAddress;
    }

    function isUserActionsLocked() public view returns (bool) {
        return _isUserActionsLocked;
    }

    // ADMIN --------------------------------------------------------------

    function setCoefficient(address asset, uint8 depositTerm, uint8 loanTerm, uint value)
        public
        onlyOwner
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm)
    {
        require(value <= 10 ** 18, "Invalid coefficient value.");

        _coefficients[asset][depositTerm][loanTerm] = value;
    }

    function setCollateralRatio(address loanAsset, address collateralAsset, uint collateralRatio) public onlyOwner {
        require(collateralRatio >= MIN_COLLATERAL_RATIO);

        _collateralRatioMap[loanAsset][collateralAsset] = collateralRatio;
    }

    function setLiquidationDiscount(address loanAsset, address collateralAsset, uint liquidationDiscount) public onlyOwner {
        require(liquidationDiscount >= 0);
        require(liquidationDiscount <= MAX_LIQUIDATION_DISCOUNT);

        _liquidationDiscountMap[loanAsset][collateralAsset] = liquidationDiscount;
    }

    function setLoanInterestRate(address asset, uint8 loanTerm, uint value)
        public
        onlyOwner
        validLoanTerm(loanTerm)
    {
        _loanInterestRates[asset][loanTerm] = value;
    }

    function setProfitRatio(uint value) public onlyOwner {
        require(value <= MAX_PROFIT_RATIO, "Invalid profit ratio.");

        _profitRatio = value;
    }

    function setShareholderAddress(address shareholderAddress) public onlyOwner {
        require(shareholderAddress != address(0), "Invalid shareholder address.");

        _shareholderAddress = shareholderAddress;
    }

    function lockAllUserActions() external onlyOwner {
        _isUserActionsLocked = true;
    }

    function unlockAllUserActions() external onlyOwner {
        _isUserActionsLocked = false;
    }
}
