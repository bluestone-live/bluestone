pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/// A group of pools where the size is defined by the deposit term.
/// 
/// - Pool ID: an internal identifier used to lookup a Pool struct. 
/// - Pool Index: used to mark the pool position, starting from 0. For example, 
///     a pool group of size 7 includes pool indices from 0 to 6, respectively.
contract PoolGroup {
    using SafeMath for uint;

    uint public totalDeposit;
    uint public totalLoan; 
    uint public totalRepaid;
    uint public totalLoanableAmount;

    // The total amount that has loaned to each loan term
    mapping(uint8 => uint) public totalLoanPerTerm;

    // The total amount that has repaid to each loan term
    mapping(uint8 => uint) public totalRepaidPerTerm;

    struct Pool {
        uint oneTimeDeposit;
        uint recurringDeposit;
        uint loanableAmount;
    }

    /// A static array initialized to actual pools, where each pool is identified by an ID.
    Pool[] public poolsById;

    /// Given a pool index, it resolves to a pool ID. Basically it stores all pool IDs 
    /// and updates them after one day to reflect the maturity change. 
    /// 
    /// For a pool group of size 7, the state of this array changing overtime:
    /// 1st day: [0, 1, 2, 3, 4, 5, 6]
    /// 2nd day: [1, 2, 3, 4, 5, 6, 0]
    /// 3rd day: [2, 3, 4, 5, 6, 0, 1]
    /// …
    /// 7th day: [6, 0, 1, 2, 3, 4, 5]
    uint8[] public poolIds;

    constructor(uint8 term) public {
        for (uint8 i = 0; i < term; i++) {
            poolsById.push(Pool({
                oneTimeDeposit: 0,
                recurringDeposit: 0,
                loanableAmount: 0
            }));

            poolIds.push(i);
        }
    }

    function getOneTimeDepositFromPool(uint8 index) external view returns (uint) {
        uint8 poolId = poolIds[index];
        return poolsById[poolId].oneTimeDeposit;
    }

    function getRecurringDepositFromPool(uint8 index) external view returns (uint) {
        uint8 poolId = poolIds[index];
        return poolsById[poolId].recurringDeposit;
    }

    function getLoanableAmountFromPool(uint8 index) external view returns (uint) {
        uint8 poolId = poolIds[index];
        return poolsById[poolId].loanableAmount;
    }

    function addOneTimeDepositToPool(uint8 index, uint amount) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount); 
        pool.loanableAmount = pool.loanableAmount.add(amount);
        totalDeposit = totalDeposit.add(amount);
        totalLoanableAmount = totalLoanableAmount.add(amount);
    }

    function addRecurringDepositToPool(uint8 index, uint amount) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.recurringDeposit = pool.recurringDeposit.add(amount); 
        pool.loanableAmount = pool.loanableAmount.add(amount);
        totalDeposit = totalDeposit.add(amount);
        totalLoanableAmount = totalLoanableAmount.add(amount);
    }

    function withdrawOneTimeDepositFromPool(uint8 index, uint amount) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
        pool.loanableAmount = pool.loanableAmount.sub(amount);
        totalDeposit = totalDeposit.sub(amount);
        totalLoanableAmount = totalLoanableAmount.sub(amount);
    }

    function loanFromPool(uint8 index, uint amount, uint8 loanTerm) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.loanableAmount = pool.loanableAmount.sub(amount);
        totalLoan = totalLoan.add(amount);
        totalLoanableAmount = totalLoanableAmount.sub(amount);
        totalLoanPerTerm[loanTerm] = totalLoanPerTerm[loanTerm].add(amount);
    }

    function repayLoanToPool(uint8 index, uint amount, uint8 loanTerm) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.loanableAmount = pool.loanableAmount.add(amount);
        totalRepaid = totalRepaid.add(amount);
        totalLoanableAmount = totalLoanableAmount.add(amount);
        totalRepaidPerTerm[loanTerm] = totalRepaidPerTerm[loanTerm].add(amount);
    }

    function transferRecurringDepositToOneTimeDeposit(uint8 index, uint amount) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.recurringDeposit = pool.recurringDeposit.sub(amount);
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount);
    }

    function transferOneTimeDepositToRecurringDeposit(uint8 index, uint amount) external {
        uint8 poolId = poolIds[index];
        Pool storage pool = poolsById[poolId];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
        pool.recurringDeposit = pool.recurringDeposit.add(amount);
    }

    /// Update pool ID at each index to reflect the maturity change of the pools using formula:
    /// poolId = (poolId + 1) % poolGroup.length
    function updatePoolIds() external {
        for (uint8 i = 0; i < poolIds.length; i++) {
            poolIds[i] = (poolIds[i] + 1) % uint8(poolIds.length);           
        }
    }
}
