pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/// @title A group of pools where the size is defined by the terms.
/// Each pool can be deposited to and withdrawn from.
contract PoolGroup {
    using SafeMath for uint;

    struct Pool {
        uint oneTimeDeposit;
        uint recurringDeposit;
    }

    uint public firstPoolIndex;
    uint public lastPoolIndex;

    /// Identify pool by the index, i.e., position. The index increments every day.
    mapping(uint => Pool) public poolsByIndex;

    /// Identify pool by the ID.
    mapping(uint8 => Pool) public poolsById;

    constructor(uint8 terms) public {
        firstPoolIndex = 1;
        lastPoolIndex = terms;

        for (uint8 id = 1; id <= terms; id++) {
            Pool memory pool = Pool({
                oneTimeDeposit: 0,
                recurringDeposit: 0
            });

            poolsByIndex[id] = pool;
            poolsById[id] = pool; 
        }
    }

    function getOneTimeDeposit(uint8 index) external view returns (uint) {
        Pool storage pool = poolsByIndex[firstPoolIndex + index - 1];
        return pool.oneTimeDeposit;
    }

    function getRecurringDeposit(uint8 index) external view returns (uint) {
        Pool storage pool = poolsByIndex[firstPoolIndex + index - 1];
        return pool.recurringDeposit;
    }

    function addToOneTimeDeposit(uint8 index, uint amount) external {
        Pool storage pool = poolsByIndex[firstPoolIndex + index - 1];
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount); 
    }

    function addToRecurringDeposit(uint8 index, uint amount) external {
        Pool storage pool = poolsByIndex[firstPoolIndex + index - 1];
        pool.recurringDeposit = pool.recurringDeposit.add(amount); 
    }

    function withdrawOneTimeDeposit(uint8 index, uint amount) external {
        Pool storage pool = poolsByIndex[firstPoolIndex + index - 1];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
    }

    function transferRecurringDepositToOneTimeDeposit(uint8 poolId, uint amount) external {
        Pool storage pool = poolsById[poolId];
        pool.recurringDeposit = pool.recurringDeposit.sub(amount);
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount);
    }

    function transferOneTimeDepositToRecurringDeposit(uint8 poolId, uint amount) external {
        Pool storage pool = poolsById[poolId];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
        pool.recurringDeposit = pool.recurringDeposit.add(amount);
    }

    /// Append the first pool to the end of the pools. This function is needed
    /// to reflect the deposit maturity change after one day. Notice that we 
    /// do not delete the original first pool because it's not necessary.
    /// For example, 1->2->3->4->5->6->7 becomes 2->3->4->5->6->7->8
    function moveFirstPoolToLastPool() external {
        Pool storage firstPool = poolsByIndex[firstPoolIndex];
        firstPoolIndex++;
        lastPoolIndex++;
        poolsByIndex[lastPoolIndex] = firstPool;
    }
}
