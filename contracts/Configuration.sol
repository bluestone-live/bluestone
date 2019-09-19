pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


// Stores and retrieves business configurations. 
contract Configuration is Ownable {
    uint private constant MIN_COLLATERAL_RATIO = 12 * (10 ** 17); // 1.2 (120%)
    uint private constant MAX_LIQUIDATION_DISCOUNT = 5 * (10 ** 16); // 0.05 (5%)
    uint private constant MAX_PROTOCOL_RESERVE_RATIO = 3 * (10 ** 17); // 0.3 (30%)

    event LockUserActions();
    event UnlockUserActions();

    // loan asset address -> collateral asset address -> collteral ratio 
    mapping(address => mapping(address => uint)) private _collateralRatioMap;

    // loan asset address -> collateral asset address -> liquidation discount
    mapping(address => mapping(address => uint)) private _liquidationDiscountMap;

    // loan asset address -> loan term -> loan annual interest rate
    mapping(address => mapping(uint => uint)) private _loanInterestRates;

    // The percentage protocol takes from deposit interest as reserve
    uint private _protocolReserveRatio = 15 * (10 ** 16); // 0.15 (15%)

    // Protocol address which receives profit
    address private _protocolAddress;

    // Lock all functionalities related to deposit, loan and liquidating
    bool private _isUserActionsLocked;

    function getCollateralRatio(address loanAsset, address collateralAsset) external view returns (uint) {
        return _collateralRatioMap[loanAsset][collateralAsset];
    }

    function getLiquidationDiscount(address loanAsset, address collateralAsset) external view returns (uint) {
        return _liquidationDiscountMap[loanAsset][collateralAsset];
    }

    function getLoanInterestRate(address asset, uint loanTerm) external view returns (uint) {
        return _loanInterestRates[asset][loanTerm];
    }

    function getProtocolReserveRatio() external view returns (uint) {
        return _protocolReserveRatio;
    }

    function getProtocolAddress() external view returns (address) {
        return _protocolAddress;
    }

    function isUserActionsLocked() public view returns (bool) {
        return _isUserActionsLocked;
    }

    // ADMIN --------------------------------------------------------------

    function setCollateralRatio(address loanAsset, address collateralAsset, uint collateralRatio) public onlyOwner {
        require(collateralRatio >= MIN_COLLATERAL_RATIO);

        _collateralRatioMap[loanAsset][collateralAsset] = collateralRatio;
    }

    function setLiquidationDiscount(address loanAsset, address collateralAsset, uint liquidationDiscount) public onlyOwner {
        require(liquidationDiscount >= 0);
        require(liquidationDiscount <= MAX_LIQUIDATION_DISCOUNT);

        _liquidationDiscountMap[loanAsset][collateralAsset] = liquidationDiscount;
    }

    function setLoanInterestRate(address asset, uint loanTerm, uint value)
        public
        onlyOwner
    {
        _loanInterestRates[asset][loanTerm] = value;
    }

    function setProtocolReserveRatio(uint value) public onlyOwner {
        require(value <= MAX_PROTOCOL_RESERVE_RATIO, "Invalid protocol reserve ratio.");

        _protocolReserveRatio = value;
    }

    function setProtocolAddress(address protocolAddress) public onlyOwner {
        require(protocolAddress != address(0), "Invalid protocol address.");

        _protocolAddress = protocolAddress;
    }

    function lockAllUserActions() external onlyOwner {
        _isUserActionsLocked = true;
        emit LockUserActions();
    }

    function unlockAllUserActions() external onlyOwner {
        _isUserActionsLocked = false;
        emit UnlockUserActions();
    }
}
