pragma solidity ^0.6.0;

/// The medianizer is the smart contract which provides Makers trusted reference price.
///
/// https://developer.makerdao.com/feeds/
/// https://github.com/makerdao/medianizer/blob/master/src/medianizer.sol
interface IMedianizer {
    function peek() external view virtual returns (bytes32, bool);
}
