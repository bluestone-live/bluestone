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

    // INTERNAL  --------------------------------------------------------------

    /// Calculate deposit interest rate according to the following formula:
    ///
    /// rs<term> = interestEarned / totalLoanableAmount
    /// rs1 = (mb1 * rb1 * a11) / s1
    /// rs7 = (mb1 * rb1 * a71 + mb7 * rb7 * a77) / s7
    /// rs30 = (mb1 * rb1 * a301 + mb7 * rb7 * a307 + mb30 * rb30 * a3030) / s30
    ///
    /// where rs1 = The deposit interest rate of 1-day term
    ///       mb1 = The amount has loaned on 1-day term
    ///       rb1 = The loan interest rate of 1-day term
    ///       a71 = The coefficient of 1-day loan borrowed from 7-day deposit pool group
    ///       s7  = The loanable amount of 7-day pool group
    function _calculateInterestRate(address asset, uint8 depositTerm) internal view returns (uint) {
        uint8[3] memory loanTerms = [1, 7, 30];
        uint interestEarned = 0;

        for (uint i = 0; i < loanTerms.length; i++) {
            uint8 loanTerm = loanTerms[i];

            // Depending on the depositTerm, we update interestEarned
            if (loanTerm <= depositTerm) {
                uint totalLoan = _liquidityPools.poolGroups(asset, loanTerm).totalLoan();
                uint loanInterestRate = _config.getLoanInterestRate(loanTerm);
                uint coefficient = _config.getCoefficient(depositTerm, loanTerm);

                interestEarned = interestEarned.add(
                    totalLoan.mulFixed(loanInterestRate).mulFixed(coefficient)
                );
            }
        }

        uint totalLoanableAmount = _liquidityPools.poolGroups(asset, depositTerm).totalLoanableAmount();

        return interestEarned.divFixed(totalLoanableAmount);
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
        uint interestRate = _calculateInterestRate(asset, term);
        uint duration = currTimestamp.sub(lastTimestamp);

        // index = index * (1 + r * t)
        uint currInterestIndex = prevInterestIndex.mulFixed(ONE.add(interestRate.mulFixed(duration)));

        depositAsset.interestIndexPerTerm[term] = currInterestIndex;
        depositAsset.lastTimestampPerTerm[term] = currTimestamp;

        return currInterestIndex;
    }
}
