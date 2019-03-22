pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/// @title A group of pools where the size is defined by the terms.
/// Each pool can be deposited to and withdrawn from.
contract PoolGroup {
    using SafeMath for uint;

    uint public totalDeposit;
    uint public totalLoan;

    struct Pool {
        uint oneTimeDeposit;
        uint recurringDeposit;
        uint loanableAmount;
    }

    /// A fixed-size list of pools. To get a N-day pool, use `pools[N - 1]`.
    Pool[] public pools;

    /// A fixed-size list of pool indexes which can be used to retreive a pool given a term:
    /// Term -> Index -> Pool: `pools[poolIndexes[term - 1]]`.
    uint8[] public poolIndexes;

    constructor(uint8 term) public {
        for (uint8 i = 0; i < term; i++) {
            pools.push(Pool({
                oneTimeDeposit: 0,
                recurringDeposit: 0,
                loanableAmount: 0
            }));

            poolIndexes.push(i);
        }
    }

    function getPoolIndexByTerm(uint8 term) public view returns (uint8) {
        return poolIndexes[term - 1];
    }

    function getOneTimeDeposit(uint8 term) external view returns (uint) {
        uint8 poolIndex = getPoolIndexByTerm(term);
        return pools[poolIndex].oneTimeDeposit;
    }

    function getRecurringDeposit(uint8 term) external view returns (uint) {
        uint8 poolIndex = getPoolIndexByTerm(term);
        return pools[poolIndex].recurringDeposit;
    }

    function getLoanableAmount(uint8 term) external view returns (uint) {
        uint8 poolIndex = getPoolIndexByTerm(term);
        return pools[poolIndex].loanableAmount;
    }

    function addToOneTimeDeposit(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount); 
        pool.loanableAmount = pool.loanableAmount.add(amount);
        totalDeposit = totalDeposit.add(amount);
    }

    function addToRecurringDeposit(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.recurringDeposit = pool.recurringDeposit.add(amount); 
        pool.loanableAmount = pool.loanableAmount.add(amount);
        totalDeposit = totalDeposit.add(amount);
    }

    function withdrawOneTimeDeposit(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
        pool.loanableAmount = pool.loanableAmount.sub(amount);
        totalDeposit = totalDeposit.sub(amount);
    }

    function loan(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.loanableAmount = pool.loanableAmount.sub(amount);
        totalLoan = totalLoan.add(amount);
    }

    function repayLoan(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.loanableAmount = pool.loanableAmount.add(amount);
        totalLoan = totalLoan.sub(amount);
    }

    function transferRecurringDepositToOneTimeDeposit(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.recurringDeposit = pool.recurringDeposit.sub(amount);
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount);
    }

    function transferOneTimeDepositToRecurringDeposit(uint8 term, uint amount) external {
        uint8 poolIndex = getPoolIndexByTerm(term);
        Pool storage pool = pools[poolIndex];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
        pool.recurringDeposit = pool.recurringDeposit.add(amount);
    }

    /// Increment each pool index to reflect the maturity of the pools. 
    /// For example, for 7-day term pools:
    /// 1st day: [0, 1, 2, 3, 4, 5, 6]
    /// 2nd day: [1, 2, 3, 4, 5, 6, 0]
    /// 3rd day: [2, 3, 4, 5, 6, 0, 1]
    /// …
    /// 7th day: [6, 0, 1, 2, 3, 4, 5]
    function incrementPoolIndexes() external {
        for (uint8 i = 0; i < poolIndexes.length; i++) {
            poolIndexes[i] = (poolIndexes[i] + 1) % uint8(poolIndexes.length);           
        }
    }
}
