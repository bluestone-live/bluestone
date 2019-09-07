pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./TokenManager.sol";


contract AccountManager is Pausable {
    using SafeMath for uint;

    TokenManager private _tokenManager;

    struct Statistics {
        // key -> integer value 
        mapping(string => uint) generalStats;

        // asset -> key -> integer value
        mapping(address => mapping(string => uint)) assetStats;
    }

    // account -> stats
    mapping(address => Statistics) _accountStats;

    /// user -> asset -> freed collateral
    /// When a loan has been repaid and liquidated, the remaining collaterals
    /// becomes "free" and can be withdrawn or be used for new loan
    mapping(address => mapping(address => uint)) private _freedCollaterals;

    event WithdrawFreedCollateralSuccessful(address indexed user, uint amount);

    constructor(
        TokenManager tokenManager
    )
        public
    {
        _tokenManager = tokenManager;
    }

    function getGeneralStat(address account, string memory key) public whenNotPaused view returns (uint) {
        return _accountStats[account].generalStats[key];
    }

    function getAssetStat(address account, address asset, string memory key) public whenNotPaused view returns (uint) {
        return _accountStats[account].assetStats[asset][key];
    }

    function setGeneralStat(address account, string memory key, uint value) public whenNotPaused {
        // TODO: verify msg.sender
        _accountStats[account].generalStats[key] = value;
    }

    function setAssetStat(address account, address asset, string memory key, uint value) public whenNotPaused {
        // TODO: verify msg.sender
        _accountStats[account].assetStats[asset][key] = value;
    }

    function incrementGeneralStat(address account, string calldata key, uint value) external whenNotPaused {
        uint prevStat = getGeneralStat(account, key);
        setGeneralStat(account, key, prevStat.add(value));
    }

    function incrementAssetStat(address account, address asset, string calldata key, uint value) external whenNotPaused {
        uint prevStat = getAssetStat(account, asset, key);
        setAssetStat(account, asset, key, prevStat.add(value));
    }

    function getFreedCollateral(address asset) external whenNotPaused view returns (uint) {
        return _freedCollaterals[msg.sender][asset];
    }

    // only can call by user
    function withdrawFreedCollateral(address asset, uint amount) external whenNotPaused {
        address user = msg.sender;
        uint availableFreedCollateral = decreaseFreedCollateral(asset, user, amount);
        _tokenManager.sendTo(user, asset, availableFreedCollateral);
        emit WithdrawFreedCollateralSuccessful(user, amount);
    }

    // only can call by other contract
    function increaseFreedCollateral(address asset, address user, uint amount) external {
        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].add(amount);
    }

    function decreaseFreedCollateral(address asset, address user, uint amount) public returns (uint) {
        require(amount > 0, "The decrease in Freed collateral amount must be greater than 0.");

        uint availableFreedCollateral = Math.min(_freedCollaterals[user][asset], amount);

        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].sub(availableFreedCollateral);

        return availableFreedCollateral;
    }
}
