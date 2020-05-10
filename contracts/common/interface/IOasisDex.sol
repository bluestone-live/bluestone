pragma solidity ^0.6.7;


/// Oasis is a decentralized application that runs on the Ethereum blockchain. Anyone can use Oasis to trade tokens, borrow against them, and earn savings using Dai.
///
/// https://oasis.app/
/// https://etherscan.io/address/0x39755357759ce0d7f32dc8dc45414cca409ae24e#code
interface IOasisDex {
    function isClosed() external view returns (bool);

    function buyEnabled() external view returns (bool);

    function matchingEnabled() external view returns (bool);

    function getBuyAmount(
        address buy_gem,
        address pay_gem,
        uint256 pay_amt
    ) external view returns (uint256);

    function getPayAmount(
        address pay_gem,
        address buy_gem,
        uint256 buy_amt
    ) external view returns (uint256);
}
