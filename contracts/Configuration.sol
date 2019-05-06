pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Term.sol";


/// A deployed service that stores and retrieves business configurations. 
contract Configuration is Ownable, Term {
    uint private constant MIN_COLLATERAL_RATIO = 12 * (10 ** 17); // 1.2 (120%)
    uint private constant MAX_LIQUIDATION_DISCOUNT = 5 * (10 ** 16); // 0.05 (5%)
    uint private constant MAX_DISTRIBUTION_RATIO = 3 * (10 ** 17); // 0.3 (30%)

    mapping(address => mapping(address => uint)) private _collateralRatioMap;
    mapping(address => mapping(address => uint)) private _liquidationDiscountMap;
    mapping(uint8 => mapping(uint8 => uint)) private _coefficients;
    mapping(uint8 => uint) private _loanInterestRates;

    // The percentage we take from deposit interest as profit
    uint private _distributionRatio = 15 * (10 ** 16); // 0.15 (15%)

    // Shareholder address which receives profit
    address private _shareholderAddress;

    function getCoefficient(uint8 depositTerm, uint8 loanTerm) 
        external
        view
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm)
        returns (uint)
    {
        return _coefficients[depositTerm][loanTerm];
    }

    function getRiskParameters(address asset, address collateral) external view returns (uint, uint) {
        return (
            _collateralRatioMap[asset][collateral],
            _liquidationDiscountMap[asset][collateral]
        );
    }

    function getCollateralRatio(address asset, address collateral) external view returns (uint) {
        return _collateralRatioMap[asset][collateral];
    } 

    function getLiquidationDiscount(address asset, address collateral) external view returns (uint) {
        return _liquidationDiscountMap[asset][collateral];
    } 

    function getLoanInterestRate(uint8 loanTerm) external view validLoanTerm(loanTerm) returns (uint) {
        return _loanInterestRates[loanTerm];
    }

    function getDistributionRatio() external view returns (uint) {
        return _distributionRatio;
    }

    function getShareholderAddress() external view returns (address) {
        return _shareholderAddress;
    }

    function setCoefficient(uint8 depositTerm, uint8 loanTerm, uint value)
        public
        onlyOwner
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm)
    {
        _coefficients[depositTerm][loanTerm] = value;
    }

    /// Set risk parameters, i.e., collateral ratio and liquidation discount, 
    /// for a asset/collateral pair.
    /// @param asset asset token
    /// @param collateral collateral token
    /// @param collateralRatio collateral ratio scaled by 1e18.
    /// @param liquidationDiscount liquidation discount scaled by 1e18.
    function setRiskParameters(
        address asset, 
        address collateral, 
        uint collateralRatio, 
        uint liquidationDiscount
    ) 
        public onlyOwner 
    {
        require(collateralRatio >= MIN_COLLATERAL_RATIO);
        require(liquidationDiscount >= 0);
        require(liquidationDiscount <= MAX_LIQUIDATION_DISCOUNT);

        _collateralRatioMap[asset][collateral] = collateralRatio;
        _liquidationDiscountMap[asset][collateral] = liquidationDiscount;
    }

    function setLoanInterestRate(uint8 loanTerm, uint value)
        public
        onlyOwner
        validLoanTerm(loanTerm)
    {
        _loanInterestRates[loanTerm] = value;
    }

    function setDistributionRatio(uint value) public onlyOwner {
        require(value <= MAX_DISTRIBUTION_RATIO, "Invalid distribution ratio.");

        _distributionRatio = value;
    }

    function setShareholderAddress(address shareholderAddress) public onlyOwner {
        require(shareholderAddress != address(0), "Invalid shareholder address.");

        _shareholderAddress = shareholderAddress;
    }
}
