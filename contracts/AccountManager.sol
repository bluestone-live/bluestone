pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/Math.sol';
import './TokenManager.sol';

contract AccountManager is Pausable {
    using SafeMath for uint256;

    TokenManager private _tokenManager;

    struct Statistics {
        // key -> integer value
        mapping(string => uint256) generalStats;
        // asset -> key -> integer value
        mapping(address => mapping(string => uint256)) assetStats;
    }

    // account -> stats
    mapping(address => Statistics) _accountStats;

    /// user -> asset -> freed collateral
    /// When a loan has been repaid and liquidated, the remaining collaterals
    /// becomes "free" and can be withdrawn or be used for new loan
    mapping(address => mapping(address => uint256)) private _freedCollaterals;

    event WithdrawFreedCollateralSuccessful(
        address indexed user,
        uint256 amount
    );

    constructor(TokenManager tokenManager) public {
        _tokenManager = tokenManager;
    }

    function getGeneralStat(address account, string memory key)
        public
        view
        whenNotPaused
        returns (uint256)
    {
        return _accountStats[account].generalStats[key];
    }

    function getAssetStat(address account, address asset, string memory key)
        public
        view
        whenNotPaused
        returns (uint256)
    {
        return _accountStats[account].assetStats[asset][key];
    }

    function setGeneralStat(address account, string memory key, uint256 value)
        public
        whenNotPaused
    {
        // TODO: verify msg.sender
        _accountStats[account].generalStats[key] = value;
    }

    function setAssetStat(
        address account,
        address asset,
        string memory key,
        uint256 value
    ) public whenNotPaused {
        // TODO: verify msg.sender
        _accountStats[account].assetStats[asset][key] = value;
    }

    function incrementGeneralStat(
        address account,
        string calldata key,
        uint256 value
    ) external whenNotPaused {
        uint256 prevStat = getGeneralStat(account, key);
        setGeneralStat(account, key, prevStat.add(value));
    }

    function incrementAssetStat(
        address account,
        address asset,
        string calldata key,
        uint256 value
    ) external whenNotPaused {
        uint256 prevStat = getAssetStat(account, asset, key);
        setAssetStat(account, asset, key, prevStat.add(value));
    }

    function getFreedCollateral(address user, address asset)
        external
        view
        whenNotPaused
        returns (uint256)
    {
        return _freedCollaterals[user][asset];
    }

    // only can call by user
    function withdrawFreedCollateral(address asset, uint256 amount)
        external
        whenNotPaused
    {
        address user = msg.sender;
        uint256 availableFreedCollateral = decreaseFreedCollateral(
            asset,
            user,
            amount
        );
        _tokenManager.sendTo(user, asset, availableFreedCollateral);
        emit WithdrawFreedCollateralSuccessful(user, amount);
    }

    // only can call by other contract
    function increaseFreedCollateral(
        address asset,
        address user,
        uint256 amount
    ) external {
        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].add(
            amount
        );
    }

    function decreaseFreedCollateral(
        address asset,
        address user,
        uint256 amount
    ) public returns (uint256) {
        require(
            amount > 0,
            'The decrease in Freed collateral amount must be greater than 0.'
        );

        uint256 availableFreedCollateral = Math.min(
            _freedCollaterals[user][asset],
            amount
        );

        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].sub(
            availableFreedCollateral
        );

        return availableFreedCollateral;
    }
}
