pragma solidity ^0.5.0;
import "truffle/Assert.sol";


// This is a dummy test. It can be removed once we have actual tests.
contract TestHappyPath {
    function testOneEqualsToOne() public {
        uint a = 1;
        uint b = 1;
        Assert.equal(a, b, "Hmm?");
    }
}
