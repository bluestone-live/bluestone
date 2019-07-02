pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./Configuration.sol";
import "./PriceOracle.sol";
import "./TokenManager.sol";
import "./LiquidityPools.sol";
import "./PoolGroup.sol";
import "./FixedMath.sol";
import "./Deposit.sol";
import "./Term.sol";


/// The main contract which handles everything related to deposit.
contract DepositManager is Ownable, Pausable, Term {
    using SafeMath for uint;
    using FixedMath for uint;

    Configuration private _config;
    PriceOracle private _priceOracle;
    TokenManager private _tokenManager;
    LiquidityPools private _liquidityPools;

    // Hold relavent information about a deposit asset
    struct DepositAsset {
        // Only enabled asset can perform deposit-related transactions
        bool isEnabled;

        // If this asset has been initialized before
        bool isInitialized;

        // deposit term -> interest index as of last update
        mapping(uint8 => uint) interestIndexPerTerm;

        // deposit term -> timestamp as of last update
        mapping(uint8 => uint) lastTimestampPerTerm;

        // deposit term -> interest rate as of last update
        mapping(uint8 => uint) lastInterestRatePerTerm;

        // deposit term -> interest index history
        mapping(uint8 => InterestIndexHistory) interestIndexHistoryPerTerm;
    }

    // Record interest index on a daily basis
    struct InterestIndexHistory {
        mapping(uint => uint) interestIndexPerDay;
        uint lastDay;
    }

    // Token address -> DepositAsset
    mapping(address => DepositAsset) private _depositAssets;

    // Deposit ID -> Deposit
    mapping(bytes32 => Deposit) private _deposits;

    // User address -> List of deposit IDs
    mapping(address => bytes32[]) private _depositIdsByUser;

    uint private _numDeposit;

    uint constant private ONE = 10 ** 18;

    // How many days of interest index we want to keep in InterestIndexHistory
    uint constant private DAYS_OF_INTEREST_INDEX_TO_KEEP = 30;

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
        public 
        whenNotPaused
        enabledDepositAsset(asset) 
        validDepositTerm(term) 
        returns (bytes32)
    {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, term);
        uint8 lastPoolIndex = term - 1;

        if (isRecurring) {
            poolGroup.addRecurringDepositToPool(lastPoolIndex, amount);
        } else {
            poolGroup.addOneTimeDepositToPool(lastPoolIndex, amount);
        }

        _numDeposit++;

        // Generate a unique hash as deposit ID
        bytes32 depositId = keccak256(abi.encode(_numDeposit));
        address user = msg.sender;
        uint currInterestIndex = updateDepositAssetInterestInfo(asset, term);
        uint profitRatio = _config.getProfitRatio();

        _deposits[depositId] = new Deposit(
            asset,
            user, 
            term, 
            amount, 
            currInterestIndex, 
            profitRatio,
            isRecurring
        );

        _depositIdsByUser[user].push(depositId);

        _tokenManager.receiveFrom(user, asset, amount);

        return depositId;
    }
    
    function setRecurringDeposit(address asset, bytes32 depositId, bool enableRecurring) 
        external 
        whenNotPaused
        enabledDepositAsset(asset) 
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
    
    function withdraw(address asset, bytes32 depositId) 
        external 
        whenNotPaused
        enabledDepositAsset(asset) 
        returns (uint) 
    {
        Deposit currDeposit = _deposits[depositId];
        address user = msg.sender;
 
        require(user == currDeposit.owner(), "Must be owner.");
        require(!currDeposit.isRecurring(), "Deposit must not be recurring.");
        require(!currDeposit.isWithdrawn(), "Deposit must not be withdrawn already.");
        require(currDeposit.isMatured(), "Deposit must be matured.");

        uint8 term = currDeposit.term();
        updateDepositAssetInterestInfo(asset, term);

        if (currDeposit.isOverDue()) {
            // If a deposit is over due, depositor can only receive principle as a penalty
            uint withdrewAmount = currDeposit.withdrawDeposit();
            _tokenManager.sendTo(user, asset, withdrewAmount);

            // Note: interests profit will remain in tokenManager account
            return withdrewAmount;
        } else {
            // Otherwise, depositor receives principle plus accrued interests
            uint numDaysAgo = DateTime.toDays(now - currDeposit.maturedAt());
            uint interestIndex = _getInterestIndexFromDaysAgo(asset, term, numDaysAgo);
            (uint withdrewAmount, uint interestsForShareholders) = currDeposit.withdrawDepositAndInterest(interestIndex);
            address shareholder = _config.getShareholderAddress();

            _tokenManager.sendTo(user, asset, withdrewAmount);
            _tokenManager.sendTo(shareholder, asset, interestsForShareholders);

            return withdrewAmount;
        }
    }

    function isDepositAssetEnabled(address asset) external whenNotPaused view returns (bool) {
        return _depositAssets[asset].isEnabled;
    }

    function getDepositInterestRates(address asset) external view enabledDepositAsset(asset) returns (uint, uint, uint) {
        return (
            _depositAssets[asset].lastInterestRatePerTerm[1],
            _depositAssets[asset].lastInterestRatePerTerm[7],
            _depositAssets[asset].lastInterestRatePerTerm[30]
        );
    }

    function getDepositIdsByUser(address user) external view whenNotPaused returns (bytes32[] memory) {
        return _depositIdsByUser[user];
    }

    // Calculate new interest rate and interest index, and update them in DepositAsset
    function updateDepositAssetInterestInfo(address asset, uint8 term) public whenNotPaused returns (uint) {
        // TODO: verify msg.sender to be DepositManager or LoanManager

        DepositAsset storage depositAsset = _depositAssets[asset];

        uint currTimestamp = now;
        uint lastTimestamp = depositAsset.lastTimestampPerTerm[term];
        uint prevInterestIndex = depositAsset.interestIndexPerTerm[term];
        uint interestRate = _calculateInterestRate(asset, term);
        uint duration = currTimestamp.sub(lastTimestamp);

        uint currInterestIndex = _calculateInterestIndex(prevInterestIndex, interestRate, duration);

        depositAsset.interestIndexPerTerm[term] = currInterestIndex;
        depositAsset.lastTimestampPerTerm[term] = currTimestamp;
        depositAsset.lastInterestRatePerTerm[term] = interestRate;

        return currInterestIndex;
    }

    // ADMIN --------------------------------------------------------------

    function enableDepositAsset(address asset) external whenNotPaused onlyOwner {
        DepositAsset storage depositAsset = _depositAssets[asset];

        require(!depositAsset.isEnabled, "This asset is enabled already.");

        _liquidityPools.initPoolGroupsIfNeeded(asset);

        if (!depositAsset.isInitialized) {
            depositAsset.interestIndexPerTerm[1] = ONE;
            depositAsset.interestIndexPerTerm[7] = ONE;
            depositAsset.interestIndexPerTerm[30] = ONE;

            depositAsset.interestIndexHistoryPerTerm[1].lastDay = DAYS_OF_INTEREST_INDEX_TO_KEEP - 1;
            depositAsset.interestIndexHistoryPerTerm[7].lastDay = DAYS_OF_INTEREST_INDEX_TO_KEEP - 1;
            depositAsset.interestIndexHistoryPerTerm[30].lastDay = DAYS_OF_INTEREST_INDEX_TO_KEEP - 1;

            depositAsset.isInitialized = true;
        }

        depositAsset.isEnabled = true;
    }

    function disableDepositAsset(address asset) external whenNotPaused onlyOwner enabledDepositAsset(asset) {
        DepositAsset storage depositAsset = _depositAssets[asset];
        depositAsset.isEnabled = false;
    }

    // NOTE: The following admin functions are to be executed by backend jobs everyday at midnight

    // Update deposit maturity for each asset
    function updateAllDepositMaturity(address[] calldata assetList) external whenNotPaused onlyOwner {
        for (uint i = 0; i < assetList.length; i++) {
            updateDepositMaturity(assetList[i]);
        }
    }

    // Update deposit maturity for each PoolGroup of an asset
    function updateDepositMaturity(address asset) public whenNotPaused onlyOwner enabledDepositAsset(asset) {
        _updatePoolGroupDepositMaturity(asset, 1);
        _updatePoolGroupDepositMaturity(asset, 7);
        _updatePoolGroupDepositMaturity(asset, 30);
    }

    // Update interest index histories for each asset
    function updateAllInterestIndexHistories(address[] calldata assetList) external whenNotPaused onlyOwner {
        for (uint i = 0; i < assetList.length; i++) {
            updateInterestIndexHistories(assetList[i]);
        }
    }

    // Update interest index hisotires for different deposit terms of an asset
    function updateInterestIndexHistories(address asset) public whenNotPaused onlyOwner enabledDepositAsset(asset) {
        DepositAsset storage depositAsset = _depositAssets[asset];
        uint8[3] memory terms = [1, 7, 30];

        for (uint i = 0; i < terms.length; i++) {
            uint8 term = terms[i];

            uint currTimestamp = now;
            uint lastTimestamp = depositAsset.lastTimestampPerTerm[term];
            uint prevInterestIndex = depositAsset.interestIndexPerTerm[term];
            uint interestRate = depositAsset.lastInterestRatePerTerm[term];
            uint duration = currTimestamp.sub(lastTimestamp);
            uint currInterestIndex = _calculateInterestIndex(prevInterestIndex, interestRate, duration);

            _updateInterestIndexHistory(asset, term, currInterestIndex);
        }
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
                uint totalLoanAfterRepay = _liquidityPools.poolGroups(asset, loanTerm).getTotalLoanAfterRepay();

                if (totalLoanAfterRepay == 0) {
                    // Skip interest calculation if there is no outstanding loan
                    continue;
                }

                uint loanInterestRate = _config.getLoanInterestRate(asset, loanTerm);
                uint coefficient = _config.getCoefficient(asset, depositTerm, loanTerm);

                interestEarned = interestEarned.add(
                    totalLoanAfterRepay.mulFixed(loanInterestRate).mulFixed(coefficient)
                );
            }
        }

        uint totalLoanableAmount = _liquidityPools.poolGroups(asset, depositTerm).totalLoanableAmount();

        return interestEarned.divFixed(totalLoanableAmount);
    }

    // Add a new interest index and remove the oldest interest index if necessary
    function _updateInterestIndexHistory(address asset, uint8 term, uint interestIndex) internal {
        InterestIndexHistory storage history = _depositAssets[asset].interestIndexHistoryPerTerm[term];

        // Add a new interest index
        history.lastDay++;
        history.interestIndexPerDay[history.lastDay] = interestIndex;

        uint dayToBeDropped = history.lastDay - DAYS_OF_INTEREST_INDEX_TO_KEEP;

        if (dayToBeDropped >= DAYS_OF_INTEREST_INDEX_TO_KEEP) {
            // Remove the oldest interest index
            delete history.interestIndexPerDay[dayToBeDropped];
        }
    }

    function _getInterestIndexFromDaysAgo(address asset, uint8 term, uint numDaysAgo) internal view returns (uint) {
        InterestIndexHistory storage history = _depositAssets[asset].interestIndexHistoryPerTerm[term];
        return history.interestIndexPerDay[history.lastDay.sub(numDaysAgo)];
    }

    // PRIVATE --------------------------------------------------------------

    // Update deposit maturity for a specific PoolGroup.
    function _updatePoolGroupDepositMaturity(address asset, uint8 term) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, term);
        uint8 index = 0;
        uint oneTimeDeposit = poolGroup.getOneTimeDepositFromPool(index);

        // 1. Withdraw matured non-recurring deposit from the 1-day pool
        poolGroup.withdrawOneTimeDepositFromPool(index, oneTimeDeposit);

        // 2. Update pool IDs to reflect the deposit maturity change
        poolGroup.updatePoolIds();
    }

    function _calculateInterestIndex(
        uint prevInterestIndex, 
        uint interestRate, 
        uint duration
    ) 
        private 
        pure 
        returns (uint) 
    {
        // currIndex = prevIndex * (1 + interestRate * duration)
        return prevInterestIndex.mulFixed(ONE.add(interestRate.mul(duration)));
    }
}
