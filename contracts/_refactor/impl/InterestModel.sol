pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import '../lib/FixedMath.sol';

contract InterestModel {
    using SafeMath for uint256;
    using FixedMath for uint256;

    // Get deposit weight by amount and term.
    function getDepositWeight(uint256 amount, uint256 term)
        external
        pure
        returns (uint256)
    {
        return amount.mul(term);
    }
}
