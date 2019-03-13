pragma solidity ^0.5.0;


contract Deposit {
    address private _owner;
    uint8 private _term;
    uint private _amount;
    uint private _createdAt;
    uint private _withdrewAt;
    bool private _isRecurring;

    uint constant private DAY_IN_SECONDS = 24 * 60 * 60;

    constructor(address owner, uint8 term, uint amount, bool isRecurring) public {
        require(amount > 0);

        _owner = owner;
        _term = term;
        _amount = amount;
        _isRecurring = isRecurring;
        _createdAt = now;
    } 

    function isWithdrawn() public view returns (bool) {
        return _withdrewAt != 0;
    }

    function isMatured() public view returns (bool) {
        return now >= _createdAt + _term * DAY_IN_SECONDS;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function amount() external view returns (uint) {
        return _amount;
    }

    function term() external view returns (uint8) {
        return _term;
    }

    function isRecurring() external view returns (bool) {
        return _isRecurring;
    }

    function enableRecurring() external {
        _isRecurring = true;
    }

    function disableRecurring() external {
        _isRecurring = false;
    }

    function withdraw(address user) external {
        require(user == _owner);
        require(_isRecurring == false);
        require(!isWithdrawn());
        require(isMatured());

        // TODO: actual transfer of ERC20 token

        _withdrewAt = now;
    }
}
