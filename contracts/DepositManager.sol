pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./Configuration.sol";
import "./PriceOracle.sol";
import "./TokenManager.sol";
import "./LiquidityPools.sol";
import "./LoanManager.sol";
import "./PoolGroup.sol";
import "./FixedMath.sol";
import "./Deposit.sol";
import "./AccountManager.sol";


/// The main contract which handles everything related to deposit.
contract DepositManager is Ownable, Pausable {
    using SafeMath for uint;
    using FixedMath for uint;

    Configuration private _config;
    PriceOracle private _priceOracle;
    TokenManager private _tokenManager;
    LiquidityPools private _liquidityPools;
    LoanManager private _loanManager;
    AccountManager private _accountManager;

    // Notice that event filter only can filter indexed property
    event DepositSuccessful(address indexed user, Deposit deposit);
    event WithdrawDepositSuccessful(address indexed user, Deposit deposit);

    // Hold relavent information about a deposit asset
    struct DepositAsset {
        // Only enabled asset can perform deposit-related transactions
        bool isEnabled;

        // TODO: remove it
        // deposit term -> interest rate as of last update
        mapping(uint => uint) lastInterestRatePerTerm;

        // deposit term -> interest index history
        mapping(uint => InterestIndexHistory) interestIndexHistoryPerTerm;
    }

    // Record interest index on a daily basis
    struct InterestIndexHistory {
        /// Each interest index corresponds to a snapshot of a particular pool state
        /// before updating deposit maturity of a PoolGroup. 
        ///
        /// depositInterest = loanInterest * (deposit / totalDeposit) * (1 - profitRatio)
        /// And interestIndex here refers to `loanInterest / totalDeposit`.
        ///
        /// TODO: I couldn't find a meaningful variable name, so I kept "interestIndex",
        /// but we could replace it though.
        mapping(uint => uint) interestIndexPerDay;
        uint lastDay;
    }

    /// Include enabled and disabled deposit assets.
    /// We need to keep disabled deposit assets for deposit maturity update.
    address[] private _allDepositAssetAddresses;

    address[] private _enabledDepositAssetAddresses;

    /// Includes enabled and disabled desposit terms.
    /// We need to keep disabled deposit terms for deposit maturity update.
    uint[] private _allDepositTerms;

    uint[] private _enabledDepositTerms;

    // Deposit term -> has been enabled once?
    mapping(uint => bool) private _isDepositTermInitialized;

    // Deposit term -> enabled?
    mapping(uint => bool) private _isDepositTermEnabled;

    // Token address -> DepositAsset
    mapping(address => DepositAsset) private _depositAssets;

    // Deposit address -> valid?
    mapping(address => bool) private _isDepositValid;

    // User address -> List of Deposit 
    mapping(address => Deposit[]) private _depositsByUser;

    uint private _numDeposit;

    // How many days of interest index we want to keep in InterestIndexHistory
    uint constant private DAYS_OF_INTEREST_INDEX_TO_KEEP = 30;

    modifier enabledDepositAsset(address asset) {
        require(_depositAssets[asset].isEnabled, "Deposit asset must be enabled.");
        _;
    }

    modifier validDeposit(Deposit currDeposit) {
        require(_isDepositValid[address(currDeposit)], "Invalid deposit.");
        _;
    }

    // PUBLIC  -----------------------------------------------------------------

    function deposit(address asset, uint depositTerm, uint amount) 
        public 
        whenNotPaused
        enabledDepositAsset(asset)
        returns (Deposit)
    {
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        require(_isDepositTermEnabled[depositTerm], "Invalid deposit term.");

        address user = msg.sender;
        uint profitRatio = _config.getProfitRatio();
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, depositTerm);
        uint poolId = poolGroup.poolIds(depositTerm - 1);

        Deposit currDeposit = new Deposit(
            asset,
            user,
            depositTerm,
            amount,
            profitRatio,
            poolId
        );

        uint[] memory loanTerms = _loanManager.getLoanTerms();

        _liquidityPools.addDepositToPoolGroup(currDeposit, loanTerms);

        _numDeposit++;

        _isDepositValid[address(currDeposit)] = true;

        _depositsByUser[user].push(currDeposit);

        _tokenManager.receiveFrom(user, asset, amount);

        _accountManager.incrementGeneralStat(user, "totalDeposits", 1);
        _accountManager.incrementAssetStat(user, asset, "totalDeposits", 1);
        _accountManager.incrementAssetStat(user, asset, "totalDepositAmount", amount);

        emit DepositSuccessful(user, currDeposit);

        return currDeposit;
    }
    
    function withdraw(Deposit currDeposit) external whenNotPaused validDeposit(currDeposit) returns (uint) {
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");

        address asset = currDeposit.asset();
        address user = msg.sender;

        require(_depositAssets[asset].isEnabled, "Deposit Asset must be enabled.");
        require(user == currDeposit.owner(), "Must be owner.");
        require(!currDeposit.isWithdrawn(), "Deposit must not be withdrawn already.");
        require(currDeposit.isMatured(), "Deposit must be matured.");

        uint term = currDeposit.term();

        // Depositor receives principle plus interest
        uint numDaysAgo = DateTime.toDays(now - currDeposit.maturedAt());
        uint interestIndex = _getInterestIndexFromDaysAgo(asset, term, numDaysAgo);
        (uint withdrewAmount, uint interestsForShareholders) = currDeposit.withdrawDepositAndInterest(interestIndex);
        address shareholder = _config.getShareholderAddress();

        _tokenManager.sendTo(user, asset, withdrewAmount);
        _tokenManager.sendTo(shareholder, asset, interestsForShareholders);

        emit WithdrawDepositSuccessful(user, currDeposit);
        return withdrewAmount;
    }

    function isDepositAssetEnabled(address asset) external whenNotPaused view returns (bool) {
        return _depositAssets[asset].isEnabled;
    }

    function getInterestIndex(Deposit currDeposit) external view returns (uint) {
        require(currDeposit.owner() == msg.sender, "Must be owner");
        bool isMatured = currDeposit.isMatured();
        address asset = currDeposit.asset();
        uint term = currDeposit.term();
        uint profitRatio = currDeposit.profitRatio();
        uint poolId = currDeposit.poolId();

        if (isMatured) {
            uint numDaysAgo = DateTime.toDays(now - currDeposit.maturedAt());
            uint originalInterestIndex = _getInterestIndexFromDaysAgo(asset, term, numDaysAgo);
            return originalInterestIndex.sub(originalInterestIndex.mulFixed(profitRatio));
        }

        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, term);
        uint totalDeposit = poolGroup.getDepositByPoolId(poolId);

        if (totalDeposit == 0) {
            return 0;
        }

        uint loanInterest = poolGroup.getLoanInterestByPoolId(poolId);

        return loanInterest.sub(loanInterest.mulFixed(profitRatio)).divFixed(totalDeposit);
    }

    function getDepositsByUser(address user) external whenNotPaused view returns (Deposit[] memory) {
        // We should lock this read action because the deposit records will be affecting while the pool group is updating
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        return _depositsByUser[user];
    }

    function getDepositTerms() external view returns (uint[] memory) {
        return _enabledDepositTerms;
    }

    function getDepositAssets() external view returns (address[] memory) {
        return _enabledDepositAssetAddresses;
    }

    // ADMIN --------------------------------------------------------------
    
    function init(
        Configuration config,
        PriceOracle priceOracle,
        TokenManager tokenManager,
        LiquidityPools liquidityPools,
        LoanManager loanManager,
        AccountManager accountManager
    ) 
        public 
        whenNotPaused
        onlyOwner
    {
        _config = config;
        _priceOracle = priceOracle;
        _tokenManager = tokenManager;
        _liquidityPools = liquidityPools;
        _loanManager = loanManager;
        _accountManager = accountManager;
    }

    function enableDepositTerm(uint term) public whenNotPaused onlyOwner {
        require(!_isDepositTermEnabled[term], "Term already enabled.");

        _isDepositTermEnabled[term] = true;
        _enabledDepositTerms.push(term);

        // Only add this deposit term if it has not been enabled before 
        if (!_isDepositTermInitialized[term]) {
            _allDepositTerms.push(term);
            _isDepositTermInitialized[term] = true;
        }

        /// Initialize pool group and interest index history for each existing asset
        /// if they haven't been initialized
        for (uint i = 0; i < _enabledDepositAssetAddresses.length; i++) {
            address asset = _enabledDepositAssetAddresses[i];
            _liquidityPools.initPoolGroupIfNeeded(asset, term);
        }
    }

    /// Disable a deposit term only affects deposit action
    function disableDepositTerm(uint term) external whenNotPaused onlyOwner {
        require(_isDepositTermEnabled[term], "Term already disabled.");

        _isDepositTermEnabled[term] = false;

        // Remove term from _enabledDepositTerms
        for (uint i = 0; i < _enabledDepositTerms.length; i++) {
            if (_enabledDepositTerms[i] == term) {
                // Overwrite current term with the last term and shrink array size
                _enabledDepositTerms[i] = _enabledDepositTerms[_enabledDepositTerms.length - 1];
                delete _enabledDepositTerms[_enabledDepositTerms.length - 1];
                _enabledDepositTerms.length--;
            }
        }
    }

    function enableDepositAsset(address asset) external whenNotPaused onlyOwner {
        DepositAsset storage depositAsset = _depositAssets[asset];

        require(!depositAsset.isEnabled, "Asset is enabled already.");

        depositAsset.isEnabled = true;
        _allDepositAssetAddresses.push(asset);
        _enabledDepositAssetAddresses.push(asset);

        // Initialize pool group and interest index history if they haven't been initialized
        for (uint i = 0; i < _enabledDepositTerms.length; i++) {
            uint depositTerm = _enabledDepositTerms[i];
            _liquidityPools.initPoolGroupIfNeeded(asset, depositTerm);
        }
    }

    function disableDepositAsset(address asset) external whenNotPaused onlyOwner enabledDepositAsset(asset) {
        DepositAsset storage depositAsset = _depositAssets[asset];

        require(depositAsset.isEnabled, "Asset is disabled already.");

        depositAsset.isEnabled = false;
        
        // Remove asset from _enabledDepositAssetAddresses
        for (uint i = 0; i < _enabledDepositAssetAddresses.length; i++) {
            if (_enabledDepositAssetAddresses[i] == asset) {
                // Overwrite current asset with the last asset and shrink array size
                _enabledDepositAssetAddresses[i] = _enabledDepositAssetAddresses[_enabledDepositAssetAddresses.length - 1];
                delete _enabledDepositAssetAddresses[_enabledDepositAssetAddresses.length - 1];
                _enabledDepositAssetAddresses.length--;
            }
        }
    }

    // NOTE: The following admin functions are to be executed by backend jobs everyday at midnight

    // Update deposit maturity for each asset
    function updateAllDepositMaturity() external whenNotPaused onlyOwner {
        for (uint i = 0; i < _allDepositAssetAddresses.length; i++) {
            _updateDepositMaturity(_allDepositAssetAddresses[i]);
        }
    }

    // INTERNAL  --------------------------------------------------------------

    // Add a new interest index
    function _updateInterestIndexHistory(address asset, uint term, uint interestIndex) internal {
        InterestIndexHistory storage history = _depositAssets[asset].interestIndexHistoryPerTerm[term];

        // Add a new interest index
        history.lastDay++;
        history.interestIndexPerDay[history.lastDay] = interestIndex;
    }

    function _getInterestIndexFromDaysAgo(address asset, uint term, uint numDaysAgo) internal view returns (uint) {
        InterestIndexHistory storage history = _depositAssets[asset].interestIndexHistoryPerTerm[term];
        return history.interestIndexPerDay[history.lastDay.sub(numDaysAgo)];
    }

    // Update deposit maturity for each PoolGroup of an asset
    function _updateDepositMaturity(address asset) internal whenNotPaused onlyOwner {
        uint[] memory loanTerms = _loanManager.getLoanTerms();

        for (uint i = 0; i < _allDepositTerms.length; i++) {
            uint depositTerm = _allDepositTerms[i];
            PoolGroup poolGroup = _liquidityPools.poolGroups(asset, depositTerm);
            uint index = 0;
            uint totalDeposit = poolGroup.getDepositFromPool(index);
            uint loanInterest = poolGroup.getLoanInterestFromPool(index);
            uint interestIndex;

            if (totalDeposit > 0) {
                interestIndex = loanInterest.divFixed(totalDeposit);
            } else {
                interestIndex = 0;
            }

            _updateInterestIndexHistory(asset, depositTerm, interestIndex);

            _liquidityPools.updatePoolGroupDepositMaturity(asset, depositTerm, loanTerms);
        }
    }
}
