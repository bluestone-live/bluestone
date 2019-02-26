pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract FixedMath {
    using SafeMath for uint256;
    uint256 precision = 10**18;

    struct Fixed {
        uint256 value;
    }

    function toFixed(uint a, uint b) public view returns (Fixed memory) {
        uint c = a.mul(precision);
        uint d = c.div(b);
        return Fixed({value: d});
    }

    function addFixed(Fixed memory a, Fixed memory b) public pure returns (Fixed memory) {
        uint256 c = a.value.add(b.value);
        return Fixed({value:c});
    }

    function subFixed(Fixed memory a, Fixed memory b) public pure returns (Fixed memory) {
        uint256 c = a.value.sub(b.value);
        return Fixed({value:c});
    }

    function uintMulFixed(uint256 a, Fixed memory b) public pure returns (Fixed memory) {
        uint256 c = a.mul(b.value);
        return Fixed({value:c});
    }

    function fixedMulFixed(Fixed memory a, Fixed memory b) public view returns (Fixed memory) {
        uint256 c = a.value.mul(b.value);
        uint256 d = c.div(precision);
        return Fixed({value:d});
    }

    function fixedDivFixed(Fixed memory a, Fixed memory b) public view returns (Fixed memory) {
        uint256 c = a.value.mul(precision);
        uint256 d = c.div(b.value);
        return Fixed({value:d});
    }

    function fixedDivUint(Fixed memory a, uint256 b) public pure returns (Fixed memory) {
        uint256 c = a.value.div(b);
        return Fixed({value:c});
    }

    function uintDivFixed(uint256 a, Fixed memory b) public view returns (Fixed memory) {
        uint256 c = a.mul(precision);
        uint256 d = c.mul(precision);
        uint256 e = d.div(b.value);
        return Fixed({value:e});
    }

    function uintDivUint(uint256 a, uint256 b) public view returns (Fixed memory) {
        uint256 c = a.mul(precision);
        uint256 d = c.div(b);
        return Fixed({value:d});
    }
}
