pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;
import "../contracts/SafeMath.sol";

contract FixedMath {
    uint256 precision = 10**18;
    struct Fixed {
        uint256 value;
    }

    function toFixed(uint a, uint b) public view returns (Fixed memory) {
        uint c = mul(a, precision);
        uint d = div(c, b);
        return Fixed({value: d});
    }

    function addFixed(Fixed memory a, Fixed memory b) public pure returns (Fixed memory) {
        uint256 c = add(a.value, b.value);
        return Fixed({value:c});
    }

    function subFixed(Fixed memory a, Fixed memory b) public pure returns (Fixed memory) {
        uint256 c = sub(a.value, b.value);
        return Fixed({value:c});
    }

    function uintMulFixed(uint256 a, Fixed memory b) public pure returns (Fixed memory) {
        uint256 c = mul(a, b.value);
        return Fixed({value:c});
    }

    function fixedMulFixed(Fixed memory a, Fixed memory b) public view returns (Fixed memory) {
        uint256 c = mul(a.value, b.value);
        uint256 d = div(c, precision);
        return Fixed({value:d});
    }

    function fixedDivFixed(Fixed memory a, Fixed memory b) public view returns (Fixed memory) {
        uint256 c = mul(a.value, precision);
        uint256 d = div(c, b.value);
        return Fixed({value:d});
    }

    function fixedDivUint(Fixed memory a, uint256 b) public pure returns (Fixed memory) {
        uint256 c = div(a.value, b);
        return Fixed({value:c});
    }

    function uintDivFixed(uint256 a, Fixed memory b) public view returns (Fixed memory) {
        uint256 c = mul(a, precision);
        uint256 d = mul(c, precision);
        uint256 e = div(d, b.value);
        return Fixed({value:e});
    }

    function uintDivUint(uint256 a, uint256 b) public view returns (Fixed memory) {
        uint256 c = mul(a, precision);
        uint256 d = div(c, b);
        return Fixed({value:d});
    }
}
