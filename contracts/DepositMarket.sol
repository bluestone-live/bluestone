pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./PoolGroup.sol";


contract DepositMarket {
    using SafeMath for uint;

    uint256 public maturedDepositAmount;
    
    ///@dev deposit term -> pool group
    mapping(uint8 => PoolGroup) poolGroups;

    struct Deposit {
        uint amount;
        uint8 term;
        uint8 poolId;
        bool isRecurring;
    }

    ///@dev ID -> deposit
    mapping(bytes => Deposit) deposits;

    constructor() public {
        maturedDepositAmount = 0;
        poolGroups[1] = new PoolGroup(1);
        poolGroups[7] = new PoolGroup(7);
        poolGroups[30] = new PoolGroup(30);
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

        // TODO: update balance
    }

    function addToRecurringDeposit(address user, uint8 term, uint amount) external {
        PoolGroup poolGroup = poolGroups[term];
        poolGroup.addToRecurringDeposit(term, amount);

        // TODO: update balance
    }

    function withdraw(address user, uint amount) external {
        // TODO: check user balance

        maturedDepositAmount = maturedDepositAmount.sub(amount);

        // TODO: update balance
    }

    function enableRecurringDeposit(bytes calldata depositId) external {
        Deposit storage deposit = deposits[depositId];

        if (!deposit.isRecurring) {
            deposit.isRecurring = true;
            uint8 term = deposit.term;
            uint8 poolId = deposit.poolId;
            uint amount = deposit.amount;
            poolGroups[term].transferOneTimeDepositToRecurringDeposit(poolId, amount);
        }
    }

    function disableRecurringDeposit(bytes calldata depositId) external {
        Deposit storage deposit = deposits[depositId];

        if (deposit.isRecurring) {
            deposit.isRecurring = false;
            uint8 term = deposit.term;
            uint8 poolId = deposit.poolId;
            uint amount = deposit.amount;
            poolGroups[term].transferRecurringDepositToOneTimeDeposit(poolId, amount);
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
        poolGroup.moveFirstPoolToLastPool();
    }
}
