pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./TokenManager.sol";


contract AccountManager is Pausable {
    using SafeMath for uint;

    TokenManager private _tokenManager;

    event WithdrawFreedCollateralSuccessful(address indexed user);

    constructor(
        TokenManager tokenManager
    )
        public
    {
        _tokenManager = tokenManager;
    }

    /// user -> asset -> freed collateral
    /// When a loan has been repaid and liquidated, the remaining collaterals
    /// becomes "free" and can be withdrawn or be used for new loan
    mapping(address => mapping(address => uint)) private _freedCollaterals;

    function getFreedCollateral(address asset) external whenNotPaused view returns (uint) {
        return _freedCollaterals[msg.sender][asset];
    }

    function withdrawFreedCollateral(address asset, uint amount) external whenNotPaused {
        address user = msg.sender;
        decreaseFreedCollateral(asset, amount);
        _tokenManager.sendTo(user, asset, amount);
        emit WithdrawFreedCollateralSuccessful(user);
    }

    function increaseFreedCollateral(address asset, uint amount) external {
        address user = msg.sender;
        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].add(amount);
    }

    function decreaseFreedCollateral(address asset, uint amount) public {
        require(amount > 0, "The decrease in Freed collateral amount must be greater than 0.");
        address user = msg.sender;

        uint availableFreedCollateral = _freedCollaterals[user][asset];

        require(amount <= availableFreedCollateral, "Not enough freed collateral.");

        _freedCollaterals[user][asset] = availableFreedCollateral.sub(amount);
    }
}
