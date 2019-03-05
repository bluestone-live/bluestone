pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./PoolGroup.sol";


contract DepositMarket {
    using SafeMath for uint;

    uint256 maturedDepositAmount;
    
    // term => pool group
    mapping(uint8 => PoolGroup) poolGroups;

    constructor() public {
        poolGroups[1] = PoolGroup(1);
        poolGroups[7] = PoolGroup(7);
        poolGroups[30] = PoolGroup(30);
    }

    function addOneTimeDeposit(address user, uint8 term, uint amount) external {
        PoolGroup poolGroup = poolGroups[term];
        poolGroup.addOneTimeDeposit(term, amount);

        // TODO: update balance
    }

    function addRecurringDeposit(address user, uint8 term, uint amount) external {
        PoolGroup poolGroup = poolGroups[term];
        poolGroup.addRecurringDeposit(term, amount);

        // TODO: update balance
    }

    function withdraw(address user, uint amount) external {
        // TODO: check user balance

        maturedDepositAmount = maturedDepositAmount.sub(amount);

        // TODO: update balance
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
