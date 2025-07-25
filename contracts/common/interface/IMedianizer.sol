// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

/// The medianizer is the smart contract which provides Makers trusted reference price.
///
/// https://developer.makerdao.com/feeds/
/// https://github.com/makerdao/medianizer/blob/master/src/medianizer.sol
interface IMedianizer {
    function peek() external view returns (bytes32, bool);

    function read() external view returns (bytes32);
}
