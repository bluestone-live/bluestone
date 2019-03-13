pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./PoolGroup.sol";
import "./Deposit.sol";


contract DepositMarket {
    using SafeMath for uint;

    uint constant private ONE = 10 ** 18;
    
    ///@dev deposit term -> pool group
    mapping(uint8 => PoolGroup) poolGroups;

    uint private _depositId;

    ///@dev ID -> deposit
    mapping(uint => Deposit) public deposits;

    mapping(uint8 => uint) interestIndexPerTerm;
    mapping(uint8 => uint) lastTimestampPerTerm;
    
    constructor() public {
        poolGroups[1] = new PoolGroup(1);
        poolGroups[7] = new PoolGroup(7);
        poolGroups[30] = new PoolGroup(30);

        interestIndexPerTerm[1] = ONE;
        interestIndexPerTerm[7] = ONE;
        interestIndexPerTerm[30] = ONE;
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
        addToDeposit(user, term, amount, isRecurring);
    }

    function addToRecurringDeposit(address user, uint8 term, uint amount) external {
        PoolGroup poolGroup = poolGroups[term];
        poolGroup.addToRecurringDeposit(term, amount);

        bool isRecurring = true;
        addToDeposit(user, term, amount, isRecurring);
    }

    function withdraw(address user, uint depositId) external {
        Deposit deposit = deposits[depositId];
        uint8 term = deposit.term();
        deposit.withdraw(user, interestIndexPerTerm[term]);
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
        poolGroup.incrementPoolIndexes();
    }

    function calculateInterestIndex(uint8 term, uint currTimestamp, uint lastTimestamp) private returns (uint) {
        uint interestRate = calculateInterestRate(term);
        uint duration = currTimestamp.sub(lastTimestamp);

        // index = index * (1 + r * t)
        return interestIndexPerTerm[term].mul(ONE.add(interestRate.mul(duration)));
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

    function addToDeposit(address user, uint8 term, uint amount, bool isRecurring) private {
        uint currTimestamp = now;
        uint lastTimestamp = lastTimestampPerTerm[term];
        interestIndexPerTerm[term] = calculateInterestIndex(term, currTimestamp, lastTimestamp);
        lastTimestampPerTerm[term] = currTimestamp;

        deposits[_depositId] = new Deposit(user, term, amount, interestIndexPerTerm[term], isRecurring);
        _depositId++;
    }
}
