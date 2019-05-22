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
    mapping(address => mapping(uint8 => uint)) private _loanInterestRates;
    mapping(uint8 => mapping(uint8 => uint)) private _coefficients;

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

    function getCollateralRatio(address loanAsset, address collateralAsset) external view returns (uint) {
        return _collateralRatioMap[loanAsset][collateralAsset];
    } 

    function getLiquidationDiscount(address loanAsset, address collateralAsset) external view returns (uint) {
        return _liquidationDiscountMap[loanAsset][collateralAsset];
    } 

    function getLoanInterestRate(address asset, uint8 loanTerm) external view validLoanTerm(loanTerm) returns (uint) {
        return _loanInterestRates[asset][loanTerm];
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
        require(value <= 10 ** 18, "Invalid coefficient value.");
        _coefficients[depositTerm][loanTerm] = value;
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

    function setDistributionRatio(uint value) public onlyOwner {
        require(value <= MAX_DISTRIBUTION_RATIO, "Invalid distribution ratio.");

        _distributionRatio = value;
    }

    function setShareholderAddress(address shareholderAddress) public onlyOwner {
        require(shareholderAddress != address(0), "Invalid shareholder address.");

        _shareholderAddress = shareholderAddress;
    }
}
