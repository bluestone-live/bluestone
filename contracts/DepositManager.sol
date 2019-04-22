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

    struct DepositAsset {
        bool isEnabled;
        mapping(uint8 => uint) interestIndexPerTerm;
        mapping(uint8 => uint) lastTimestampPerTerm;
    }

    mapping(address => DepositAsset) private _depositAssets;
    mapping(uint => Deposit) private _deposits;
    uint private _depositId;

    uint constant private ONE = 10 ** 18;

    modifier enabledDepositAsset(address asset) {
        require(_depositAssets[asset].isEnabled == true, "Deposit Asset must be enabled.");
        _;
    }

    constructor(address config, address priceOracle, address tokenManager, address liquidityPools) public {
        _config = Configuration(config);
        _priceOracle = PriceOracle(priceOracle);
        _tokenManager = TokenManager(tokenManager);
        _liquidityPools = LiquidityPools(liquidityPools);
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

        uint currInterestIndex = _updateInterestIndexAndTimestamp(asset, term);

        address user = msg.sender;
        _deposits[_depositId] = new Deposit(user, term, amount, currInterestIndex, isRecurring);
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
        uint amount = currDeposit.withdraw(user, _depositAssets[asset].interestIndexPerTerm[term]);

        _tokenManager.sendTo(user, asset, amount);
    }

    // ADMIN --------------------------------------------------------------

    function enableDepositAsset(address asset) external onlyOwner {
        DepositAsset storage depositAsset = _depositAssets[asset];

        if (!depositAsset.isEnabled) {
            _liquidityPools.initPoolGroupsIfNeeded(asset);

            // Initialize interest index if not done yet
            if (depositAsset.interestIndexPerTerm[1] == 0) {
                depositAsset.interestIndexPerTerm[1] = ONE;
                depositAsset.interestIndexPerTerm[7] = ONE;
                depositAsset.interestIndexPerTerm[30] = ONE;
            }

            depositAsset.isEnabled = true;
        }
    }

    function disableDepositAsset(address asset) external onlyOwner enabledDepositAsset(asset) {
        DepositAsset storage depositAsset = _depositAssets[asset];
        depositAsset.isEnabled = false;
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

    function _updateInterestIndexAndTimestamp(address asset, uint8 term) private returns (uint) {
        DepositAsset storage depositAsset = _depositAssets[asset];

        uint currTimestamp = now;
        uint lastTimestamp = depositAsset.lastTimestampPerTerm[term];
        uint prevInterestIndex = depositAsset.interestIndexPerTerm[term];

        // TODO: Replace dummy value
        uint interestRate = ONE;
        uint duration = currTimestamp.sub(lastTimestamp);

        // index = index * (1 + r * t)
        uint currInterestIndex = prevInterestIndex.mul(ONE.add(interestRate.mul(duration)));

        depositAsset.interestIndexPerTerm[term] = currInterestIndex;
        depositAsset.lastTimestampPerTerm[term] = currTimestamp;

        return currInterestIndex;
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
