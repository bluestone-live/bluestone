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

    uint public firstPoolKey;
    uint public lastPoolKey;
    mapping(uint => Pool) public pools;

    constructor(uint8 terms) public {
        firstPoolKey = 1;
        lastPoolKey = terms;
    }

    function addOneTimeDeposit(uint8 term, uint amount) external {
        Pool storage pool = pools[firstPoolKey + term - 1];
        pool.oneTimeDeposit = pool.oneTimeDeposit.add(amount); 
    }

    function addRecurringDeposit(uint8 term, uint amount) external {
        Pool storage pool = pools[firstPoolKey + term - 1];
        pool.recurringDeposit = pool.recurringDeposit.add(amount); 
    }

    function withdrawOneTimeDeposit(uint8 term, uint amount) external {
        Pool storage pool = pools[firstPoolKey + term - 1];
        pool.oneTimeDeposit = pool.oneTimeDeposit.sub(amount);
    }

    function withdrawRecurringDeposit(uint8 term, uint amount) external {
        Pool storage pool = pools[firstPoolKey + term - 1];
        pool.recurringDeposit = pool.recurringDeposit.sub(amount);
    }

    /// Append the first pool to the end of the pools. This function is needed
    /// to reflect the deposit maturity change after one day. Notice that we 
    /// do not delete the original first pool because it's not necessary.
    /// For example, 1->2->3->4->5->6->7 becomes 2->3->4->5->6->7->8
    function moveFirstPoolToLastPool() external {
        Pool storage firstPool = pools[firstPoolKey];
        firstPoolKey++;
        lastPoolKey++;
        pools[lastPoolKey] = firstPool;
    }
}
