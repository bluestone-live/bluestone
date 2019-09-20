pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

library FixedMath {
    using SafeMath for uint256;

    uint256 private constant PRECISION = 10**18;

    function mulFixed(uint256 a, uint256 b) internal pure returns (uint256) {
        return a.mul(b).div(PRECISION);
    }

    function divFixed(uint256 a, uint256 b) internal pure returns (uint256) {
        return a.mul(PRECISION).div(b);
    }
}
