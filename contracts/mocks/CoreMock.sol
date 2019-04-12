pragma solidity ^0.5.0;

import "../Core.sol";


contract CoreMock is Core {
    function depositFreedCollateral(address user, address asset, uint amount) public {
        super._depositFreedCollateral(user, asset, amount);
    }
}
