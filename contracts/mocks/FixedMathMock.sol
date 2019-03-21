pragma solidity ^0.5.0;

import "../FixedMath.sol";


contract FixedMathMock {
    function mulFixed(uint a, uint b) public pure returns (uint) {
        return FixedMath.mulFixed(a, b);
    }
}
