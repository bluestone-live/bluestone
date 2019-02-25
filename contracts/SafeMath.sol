pragma solidity 0.5.0;


contract SafeMath {
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 c = a + b;
        require(c > 0);
        return c;
    }

    function sub(uint256 a, uint256 b) public pure returns (uint256) {
        require(a > b);
        uint256 c = a - b;
        return c;
    }

    function mul(uint256 a, uint256 b) public pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint c = a * b;
        require(c/a == b);
        return c;
    }

    function div(uint256 a, uint256 b) public pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;
        return c;
    }
    
    function mod(uint256 a, uint256 b) public pure returns (uint256) {
        require(b > 0);
        uint256 c = a % b;
        return c;
    }
}
