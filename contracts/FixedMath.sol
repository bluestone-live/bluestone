pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


library FixedMath {
    using SafeMath for uint;

    uint private constant PRECISION = 10 ** 18;
     
    function mulFixed(uint a, uint b) internal pure returns (uint) {
        return a.mul(b).div(PRECISION);
    }
}
