pragma solidity ^0.6.7;

import '../interface/IMedianizer.sol';


contract MedianizerMock is IMedianizer {
    uint256 val;
    bool has;

    function setPrice(uint256 price) external {
        val = price;
        has = true;
    }

    function peek() external override view returns (bytes32, bool) {
        return (bytes32(val), has);
    }

    function read() external override view returns (bytes32) {
        require(has);

        return bytes32(val);
    }
}
