pragma solidity ^0.5.0;

import '../interface/IMedianizer.sol';

contract MedianizerMock is IMedianizer {
    uint256 val;
    bool has;

    function setPrice(uint256 price) external {
        val = price;
        has = true;
    }

    function peek() external view returns (bytes32, bool) {
        return (bytes32(val), has);
    }
}
