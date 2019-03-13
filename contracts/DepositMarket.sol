pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./PoolGroup.sol";
import "./Deposit.sol";


contract DepositMarket {
    using SafeMath for uint;

    uint public maturedDepositAmount;
    uint constant private ONE = 10 ** 18;
    
    ///@dev deposit term -> pool group
    mapping(uint8 => PoolGroup) poolGroups;

    uint private _depositId;

    ///@dev ID -> deposit
    mapping(uint => Deposit) public deposits;

    //@dev term -> global interest index
    mapping(uint8 => uint) globalInterestIndexes;
    
    struct Balance {
        /// Total balance with accrued interest after applying the customer's 
        /// most recent balance-changing action
        uint total;
        
        /// Total interestIndex as calculated after applying the customer's 
        /// most recent balance-changing action
        uint interestIndex;
        
        /// Last block.timestamp after applying the customer's 
        /// most recent balance-changing action
        uint lastTimestamp;
    }
    
    ///@dev user address -> term -> balance
    mapping(address => mapping(uint8 => Balance)) balances;

    constructor() public {
        maturedDepositAmount = 0;
        poolGroups[1] = new PoolGroup(1);
        poolGroups[7] = new PoolGroup(7);
        poolGroups[30] = new PoolGroup(30);

        globalInterestIndexes[1] = ONE;
        globalInterestIndexes[7] = ONE;
        globalInterestIndexes[30] = ONE;
    }

    function getOneTimeDepositFromPool(uint8 depositTerm, uint8 poolTerm) external view returns (uint) {
        return poolGroups[depositTerm].getOneTimeDeposit(poolTerm);
    }

    function getRecurringDepositFromPool(uint8 depositTerm, uint8 poolTerm) external view returns (uint) {
        return poolGroups[depositTerm].getRecurringDeposit(poolTerm);
    }

    function addToOneTimeDeposit(address user, uint8 term, uint amount) external {
        PoolGroup poolGroup = poolGroups[term];
        poolGroup.addToOneTimeDeposit(term, amount);

        bool isRecurring = false;
        deposits[_depositId] = new Deposit(user, term, amount, isRecurring);
        _depositId++;

        // Update user balance
        Balance storage balance = balances[user][term];

        if (balance.interestIndex == 0) {
            balance.interestIndex = ONE; 
        }

        /// r = Deposit interest rate
        /// t = duration, t = currTimeStamp - lastTimeStamp
        /// Gi = global interest index, Gi = Gi * (1 + r * t)
        /// Ui = user interest index, Ui = Ui * (1 + r * t)
        /// B = balance total, B = B * (Gi / Ui) + amount
        uint currTimestamp = block.timestamp;
        uint interestRate = calculateInterestRate(term);
        uint duration = currTimestamp.sub(balance.lastTimestamp);
        uint totalInterestRate = ONE.add(interestRate.mul(duration));
        uint globalInterestIndex = globalInterestIndexes[term];

        globalInterestIndexes[term] = globalInterestIndex.mul(totalInterestRate);
        balance.interestIndex = balance.interestIndex.mul(totalInterestRate);
        balance.lastTimestamp = currTimestamp;
        balance.total = balance.total.mul(globalInterestIndex.div(balance.interestIndex)).add(amount);
    }

    function addToRecurringDeposit(address user, uint8 term, uint amount) external {
        PoolGroup poolGroup = poolGroups[term];
        poolGroup.addToRecurringDeposit(term, amount);
        
        bool isRecurring = true;
        deposits[_depositId] = new Deposit(user, term, amount, isRecurring);
        _depositId++;

        // TODO: update balance
    }

    function withdraw(address user, uint depositId) external {
        Deposit deposit = deposits[depositId];
        deposit.withdraw(user);

        maturedDepositAmount = maturedDepositAmount.sub(deposit.amount());

        // TODO: update balance
    }

    function enableRecurringDeposit(address user, uint depositId) external {
        Deposit deposit = deposits[depositId];
        require(user == deposit.owner());

        if (!deposit.isRecurring()) {
            deposit.enableRecurring();
            uint8 term = deposit.term();
            uint amount = deposit.amount();
            poolGroups[term].transferOneTimeDepositToRecurringDeposit(term, amount);
        }
    }

    function disableRecurringDeposit(address user, uint depositId) external {
        Deposit deposit = deposits[depositId];
        require(user == deposit.owner());

        if (deposit.isRecurring()) {
            deposit.disableRecurring();
            uint8 term = deposit.term();
            uint amount = deposit.amount();
            poolGroups[term].transferRecurringDepositToOneTimeDeposit(term, amount);
        }
    }

    function updateDepositMaturity() external {
        updatePoolGroupDepositMaturity(poolGroups[1]);
        updatePoolGroupDepositMaturity(poolGroups[7]);
        updatePoolGroupDepositMaturity(poolGroups[30]);
    }

    function updatePoolGroupDepositMaturity(PoolGroup poolGroup) private {
        uint8 term = 1;
        uint oneTimeDeposit = poolGroup.getOneTimeDeposit(term);
        poolGroup.withdrawOneTimeDeposit(term, oneTimeDeposit);
        maturedDepositAmount = maturedDepositAmount.add(oneTimeDeposit);
        poolGroup.incrementPoolIndexes();
    }

    function calculateInterestRate(uint8 term) private returns (uint) {
        // https://freebanking.quip.com/NUZ2AqG32qJG/ASSET-LIQUIDITY-MISMATCH-MODEL
        
        // Rs7 = (Mb1 * Rb1 * a71 + Mb7 * Rb7 * a77) / S7
        // where Mb1 = The amount has loaned on 1-day term
        //       Rb1 = The loan interest rate for 1-day term
        //       a71 = B71 / Mb1 
        //           = The amount has loaned from pool 7 to 1-day term /
        //             The amount has loaded on 1-day term
        //       S7  = The amount of deposit on 7-day term

        // TODO: replace dummy value
        return ONE;
    }
}
