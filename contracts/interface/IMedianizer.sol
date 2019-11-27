pragma solidity ^0.5.0;

/// The medianizer is the smart contract which provides Makers trusted reference price.
///
/// https://developer.makerdao.com/feeds/
/// https://github.com/makerdao/medianizer/blob/master/src/medianizer.sol
contract IMedianizer {
    function peek() external view returns (bytes32, bool);
}
