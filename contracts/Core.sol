pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";


/// @title The main contract that interacts with the external world.
contract Core is Ownable, Pausable {
    uint private constant MIN_COLLATERAL_RATIO = 12 * (10 ** 17); // 1.2 (120%)
    uint private constant MAX_LIQUIDATION_DISCOUNT = 5 * (10 ** 16); // 0.05 (5%)

    mapping(address => mapping(address => uint)) public collateralRatioMap;
    mapping(address => mapping(address => uint)) public liquidationDiscountMap;

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
}
