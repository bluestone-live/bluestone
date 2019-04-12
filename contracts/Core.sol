pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./DepositManager.sol";
import "./LoanManager.sol";
import "./LiquidityPools.sol";
import "./Term.sol";


/// @title The main contract that interacts with the external world.
contract Core is Ownable, Term {
    using SafeERC20 for ERC20;
    using SafeMath for uint;

    mapping(address => DepositManager) public depositManagers;
    mapping(address => bool) public isDepositManagerInitialized;
    mapping(address => bool) public isDepositManagerEnabled;

    // loan asset -> collateral asset -> LoanManager
    mapping(address => mapping(address => LoanManager)) private loanManagers;

    // user -> asset -> freed collateral
    mapping(address => mapping(address => uint)) private _freedCollaterals;

    bool private isLiquidityPoolsInitialized = false;
    LiquidityPools private _liquidityPools;

    modifier enabledDepositManager(address asset) {
        require(isDepositManagerEnabled[asset] == true);
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

    function loan(
        uint8 term,
        address loanAsset,
        address collateralAsset,
        uint loanAmount,
        uint collateralAmount,
        uint requestedFreedCollateral
    ) 
        external 
        validLoanTerm(term)
    {
        require(loanAmount > 0);
        require(collateralAmount > 0 || requestedFreedCollateral > 0);

        address user = msg.sender;
        uint availableFreedCollateral = _freedCollaterals[user][collateralAsset];

        require(requestedFreedCollateral <= availableFreedCollateral, "Not enough freed collateral.");

        _freedCollaterals[user][collateralAsset] = availableFreedCollateral.sub(requestedFreedCollateral);

        uint totalCollateralAmount = collateralAmount.add(requestedFreedCollateral);
        LoanManager manager = loanManagers[loanAsset][collateralAsset];
        manager.loan(user, term, loanAmount, totalCollateralAmount);

        // TODO: balance transfer
    }

    function repayLoan(address loanAsset, address collateralAsset, uint loanId, uint amount) 
        external 
        returns (uint)
    {
        LoanManager manager = loanManagers[loanAsset][collateralAsset];
        address user = msg.sender;

        (uint totalRepayAmount, uint freedCollateralAmount) = manager.repayLoan(user, loanId, amount);

        // TODO: balance transfer

        _depositFreedCollateral(user, collateralAsset, freedCollateralAmount);

        return totalRepayAmount;
    }

    function liquidateLoan(address loanAsset, address collateralAsset, uint loanId, uint amount) 
        external 
        returns (uint, uint)
    {
        LoanManager manager = loanManagers[loanAsset][collateralAsset];
        address user = msg.sender;

        (uint liquidatedAmount, uint soldCollateralAmount, uint freedCollateralAmount) = manager
            .liquidateLoan(user, loanId, amount);

        // TODO: balance transfer

        _depositFreedCollateral(user, collateralAsset, freedCollateralAmount);

        return (liquidatedAmount, soldCollateralAmount);
    }

    function withdrawFreedCollateral(address asset, uint amount) external {
        require(amount > 0, "Withdraw amount must be greater than 0.");

        address user = msg.sender;
        uint availableToWithdraw = _freedCollaterals[user][asset];

        require(amount <= availableToWithdraw, "Not enough freed collateral to withdraw.");

        _freedCollaterals[user][asset] = availableToWithdraw.sub(amount);

        ERC20 token = ERC20(asset);
        token.safeTransfer(user, amount);
    }

    function getFreedCollateral(address asset) external view returns (uint) {
        return _freedCollaterals[msg.sender][asset];
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

    function updateDepositMaturity(address asset) external onlyOwner enabledDepositManager(asset) {
        DepositManager manager = depositManagers[asset];
        manager.updateDepositMaturity();
    }

    // INTERNAL --------------------------------------------------------------

    function _depositFreedCollateral(address user, address asset, uint amount) internal {
        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].add(amount);
    }
}
