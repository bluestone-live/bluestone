pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./DepositManager.sol";
import "./LiquidityPools.sol";


/// @title The main contract that interacts with the external world.
contract Core is Ownable, Pausable {
    using SafeERC20 for ERC20;

    uint private constant MIN_COLLATERAL_RATIO = 12 * (10 ** 17); // 1.2 (120%)
    uint private constant MAX_LIQUIDATION_DISCOUNT = 5 * (10 ** 16); // 0.05 (5%)

    mapping(address => mapping(address => uint)) public collateralRatioMap;
    mapping(address => mapping(address => uint)) public liquidationDiscountMap;

    mapping(address => DepositManager) public depositManagers;
    mapping(address => bool) public isDepositManagerInitialized;
    mapping(address => bool) public isDepositManagerEnabled;

    /// To make sure deposits from different pools are used efficiently and 
    /// deposit interest of 30 days is always larger than those of 7 days 
    /// and 1 day, we introduce a coefficient 'α' to decide from which 
    /// pool to draw money when a loan is made. 
    /// e.g., a307 = coefficient[30][7] = 0.3
    mapping(uint8 => mapping(uint8 => uint)) public coefficients;

    bool private isLiquidityPoolsInitialized = false;
    LiquidityPools private _liquidityPools;

    modifier enabledDepositManager(address asset) {
        require(isDepositManagerEnabled[asset] == true);
        _;
    }

    modifier validDepositTerm(uint8 term) {
        require(term == 1 || term == 7 || term == 30, "Valid deposit terms are 1, 7 and 30.");
        _;
    }
    
    modifier validLoanTerm(uint8 term) {
        require(term == 1 || term == 3 || term == 7 || term == 30, "Valid loan terms are 1, 3, 7 and 30.");
        _;
    }

    // PUBLIC  -----------------------------------------------------------------

    function deposit(
        address asset, 
        uint8 term, 
        uint amount, 
        bool isRecurring
    ) 
        external enabledDepositManager(asset) validDepositTerm(term) 
    {
        DepositManager depositManager = depositManagers[asset];

        if (isRecurring) {
            depositManager.addToRecurringDeposit(msg.sender, term, amount);
        } else {
            depositManager.addToOneTimeDeposit(msg.sender, term, amount);
        }

        // Receive tokens from the customer and transfer them to the protocol
        ERC20 token = ERC20(asset);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    function enableRecurringDeposit(address asset, uint depositId) external enabledDepositManager(asset) {
        DepositManager manager = depositManagers[asset];
        manager.enableRecurringDeposit(msg.sender, depositId);
    }
    
    function disableRecurringDeposit(address asset, uint depositId) external enabledDepositManager(asset) {
        DepositManager manager = depositManagers[asset];
        manager.disableRecurringDeposit(msg.sender, depositId);
    }
    
    function withdraw(address asset, uint depositId) external enabledDepositManager(asset) {
        DepositManager manager = depositManagers[asset];
        uint amount = manager.withdraw(msg.sender, depositId);

        // Send tokens to the customer account from the protocol
        ERC20 token = ERC20(asset);
        token.safeTransfer(msg.sender, amount);
    }

    // ADMIN ONLY --------------------------------------------------------------

    function enableDepositManager(address asset) external onlyOwner {
        /// Seems there is no obvious way to determine if a contract has been
        /// properly initialized in a mapping, so we use another variable
        /// to check and initialize the contract if necessary.
        if (!isLiquidityPoolsInitialized) {
            _liquidityPools = new LiquidityPools();
            isLiquidityPoolsInitialized = true;
        }

        if (!isDepositManagerInitialized[asset]) {
            depositManagers[asset] = new DepositManager(_liquidityPools);
            isDepositManagerInitialized[asset] = true;
        }

        isDepositManagerEnabled[asset] = true;
    }

    function disableDepositManager(address asset) external onlyOwner {
        isDepositManagerEnabled[asset] = false;
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

    function setCoefficient(uint8 depositTerm, uint8 loanTerm, uint value) 
        external
        onlyOwner
        validDepositTerm(depositTerm)
        validLoanTerm(loanTerm) 
    {
        coefficients[depositTerm][loanTerm] = value;
    }

    function updateDepositMaturity(address asset) external onlyOwner enabledDepositManager(asset) {
        DepositManager manager = depositManagers[asset];
        manager.updateDepositMaturity();
    }
}
