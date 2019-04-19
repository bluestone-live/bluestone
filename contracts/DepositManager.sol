pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./Configuration.sol";
import "./PriceOracle.sol";
import "./TokenManager.sol";
import "./LiquidityPools.sol";
import "./PoolGroup.sol";
import "./FixedMath.sol";
import "./Deposit.sol";
import "./Term.sol";


contract DepositManager is Ownable, Term {
    using SafeMath for uint;
    using FixedMath for uint;

    Configuration private _config;
    PriceOracle private _priceOracle;
    TokenManager private _tokenManager;
    LiquidityPools private _liquidityPools;

    mapping(address => bool) private _isDepositAssetEnabled;
    mapping(uint8 => uint) private _interestIndexPerTerm;
    mapping(uint8 => uint) private _lastTimestampPerTerm;
    mapping(uint => Deposit) private _deposits;
    uint private _depositId;

    uint constant private ONE = 10 ** 18;

    modifier enabledDepositAsset(address asset) {
        require(_isDepositAssetEnabled[asset] == true, "Deposit Asset must be enabled.");
        _;
    }

    constructor(address config, address priceOracle, address tokenManager, address liquidityPools) public {
        _config = Configuration(config);
        _priceOracle = PriceOracle(priceOracle);
        _tokenManager = TokenManager(tokenManager);
        _liquidityPools = LiquidityPools(liquidityPools);

        _interestIndexPerTerm[1] = ONE;
        _interestIndexPerTerm[7] = ONE;
        _interestIndexPerTerm[30] = ONE;
    }

    // PUBLIC  -----------------------------------------------------------------

    function deposit(address asset, uint8 term, uint amount, bool isRecurring) 
        external 
        enabledDepositAsset(asset) 
        validDepositTerm(term) 
    {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, term);
        uint8 lastPoolIndex = term - 1;

        if (isRecurring) {
            poolGroup.addRecurringDepositToPool(lastPoolIndex, amount);
        } else {
            poolGroup.addOneTimeDepositToPool(lastPoolIndex, amount);
        }

        uint currTimestamp = now;
        uint lastTimestamp = _lastTimestampPerTerm[term];
        _interestIndexPerTerm[term] = _calculateInterestIndex(term, currTimestamp, lastTimestamp);
        _lastTimestampPerTerm[term] = currTimestamp;

        address user = msg.sender;
        _deposits[_depositId] = new Deposit(user, term, amount, _interestIndexPerTerm[term], isRecurring);
        _depositId++;

        _tokenManager.receiveFrom(user, asset, amount);
    }
    
    function setRecurringDeposit(address asset, uint depositId, bool enableRecurring) 
        external enabledDepositAsset(asset) 
    {
        Deposit currDeposit = _deposits[depositId];
        require(msg.sender == currDeposit.owner());

        uint8 term = currDeposit.term();
        uint amount = currDeposit.amount();
        uint8 lastPoolIndex = term - 1;
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, term);

        if (enableRecurring && !currDeposit.isRecurring()) {
            currDeposit.enableRecurring();
            poolGroup.transferOneTimeDepositToRecurringDeposit(lastPoolIndex, amount);
        } else if (!enableRecurring && currDeposit.isRecurring()) {
            currDeposit.disableRecurring();
            poolGroup.transferRecurringDepositToOneTimeDeposit(lastPoolIndex, amount);
        } else {
            revert("Invalid operation.");
        }
    }
    
    function withdraw(address asset, uint depositId) external enabledDepositAsset(asset) {
        Deposit currDeposit = _deposits[depositId];
        uint8 term = currDeposit.term();
        address user = msg.sender;
        uint amount = currDeposit.withdraw(user, _interestIndexPerTerm[term]);

        _tokenManager.sendTo(user, asset, amount);
    }

    // ADMIN --------------------------------------------------------------

    function enableDepositAsset(address asset) external onlyOwner {
        if (!_isDepositAssetEnabled[asset]) {
            _liquidityPools.initPoolGroupsIfNeeded(asset);
            _isDepositAssetEnabled[asset] = true;
        }
    }

    function disableDepositAsset(address asset) external onlyOwner enabledDepositAsset(asset) {
        _isDepositAssetEnabled[asset] = false;
    }

    function updateDepositMaturity(address asset) external onlyOwner enabledDepositAsset(asset) {
        _updatePoolGroupDepositMaturity(asset, 1);
        _updatePoolGroupDepositMaturity(asset, 7);
        _updatePoolGroupDepositMaturity(asset, 30);
    }

    // PRIVATE --------------------------------------------------------------

    function _updatePoolGroupDepositMaturity(address asset, uint8 term) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, term);
        uint8 index = 0;
        uint oneTimeDeposit = poolGroup.getOneTimeDepositFromPool(index);
        poolGroup.withdrawOneTimeDepositFromPool(index, oneTimeDeposit);
        poolGroup.updatePoolIds();
    }

    function _calculateInterestIndex(uint8 term, uint currTimestamp, uint lastTimestamp) private view returns (uint) {
        // TODO: replace dummy value
        uint interestRate = ONE;
        uint duration = currTimestamp.sub(lastTimestamp);

        // index = index * (1 + r * t)
        return _interestIndexPerTerm[term].mul(ONE.add(interestRate.mul(duration)));
    }

    // function _calculateInterestRate(uint8 term) private returns (uint) {
        // https://freebanking.quip.com/NUZ2AqG32qJG/ASSET-LIQUIDITY-MISMATCH-MODEL
        
        // Rs7 = (Mb1 * Rb1 * a71 + Mb7 * Rb7 * a77) / S7
        // where Mb1 = The amount has loaned on 1-day term
        //       Rb1 = The loan interest rate for 1-day term
        //       a71 = B71 / Mb1 
        //           = The amount has loaned from pool 7 to 1-day term /
        //             The amount has loaded on 1-day term
        //       S7  = The amount of deposit on 7-day term

        // return ONE;
    // }
}
