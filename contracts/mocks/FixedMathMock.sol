pragma solidity ^0.5.0;

import '../lib/FixedMath.sol';

contract FixedMathMock {
    function mulFixed(uint256 a, uint256 b) public pure returns (uint256) {
        return FixedMath.mulFixed(a, b);
    }
}
