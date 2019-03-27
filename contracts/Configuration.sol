pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Term.sol";


/// A deployed service that stores and retrieves business configurations. 
contract Configuration is Ownable, Term {
    uint private constant MIN_COLLATERAL_RATIO = 12 * (10 ** 17); // 1.2 (120%)
    uint private constant MAX_LIQUIDATION_DISCOUNT = 5 * (10 ** 16); // 0.05 (5%)

    mapping(address => mapping(address => uint)) private collateralRatioMap;
    mapping(address => mapping(address => uint)) private liquidationDiscountMap;
    mapping(uint8 => mapping(uint8 => uint)) private coefficients;
    mapping(uint8 => uint) private loanInterestRates;

    function getCoefficient(uint8 depositTerm, uint8 loanTerm) 
        external
        view
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm)
        returns (uint)
    {
        return coefficients[depositTerm][loanTerm];
    }

    function getRiskParameters(address asset, address collateral) external view returns (uint, uint) {
        return (
            collateralRatioMap[asset][collateral],
            liquidationDiscountMap[asset][collateral]
        );
    }

    function getLoanInterestRate(uint8 loanTerm) external view validLoanTerm(loanTerm) returns (uint) {
        return loanInterestRates[loanTerm];
    }

    function setCoefficient(uint8 depositTerm, uint8 loanTerm, uint value)
        external
        onlyOwner
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm)
    {
        coefficients[depositTerm][loanTerm] = value;
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
        external onlyOwner 
    {
        require(collateralRatio >= MIN_COLLATERAL_RATIO);
        require(liquidationDiscount >= 0);
        require(liquidationDiscount <= MAX_LIQUIDATION_DISCOUNT);

        collateralRatioMap[asset][collateral] = collateralRatio;
        liquidationDiscountMap[asset][collateral] = liquidationDiscount;
    }

    function setLoanInterestRate(uint8 loanTerm, uint value)
        external
        onlyOwner
        validLoanTerm(loanTerm)
    {
        loanInterestRates[loanTerm] = value;
    }
}
