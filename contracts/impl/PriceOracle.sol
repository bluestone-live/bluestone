pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import '../interface/IPriceOracle.sol';

/// NOTE: this is a dummy price oracle that aims to help the price oracle refactor.
/// TODO(desmond): remove it once implement real price oracles
contract PriceOracle is IPriceOracle, Ownable {
    uint256 private _price;

    function getPrice() external view returns (uint256) {
        return _price;
    }

    function setPrice(uint256 requestedPrice) public onlyOwner {
        require(requestedPrice > 0, 'PriceOracle: invalid price');

        _price = requestedPrice;
    }
}
