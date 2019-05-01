pragma solidity ^0.5.0;


/// Unix timestamp conversion utilities
/// To learn more, try this online converter: https://www.epochconverter.com/
library DateTime {
    uint constant DAY_IN_SECONDS = 86400;
    uint constant HOUR_IN_SECONDS = 3600;
    uint constant MINUTE_IN_SECONDS = 60;

    function getHour(uint timestamp) public pure returns (uint8) {
        return uint8((timestamp / 60 / 60) % 24);
    }

    function getMinute(uint timestamp) public pure returns (uint8) {
        return uint8((timestamp / 60) % 60);
    }

    function getSecond(uint timestamp) public pure returns (uint8) {
        return uint8(timestamp % 60);
    }

    function secondsUntilMidnight(uint timestamp) public pure returns (uint) {
        uint8 hour = getHour(timestamp);
        uint8 minute = getMinute(timestamp);
        uint8 second = getSecond(timestamp);
        
        return DAY_IN_SECONDS - hour * HOUR_IN_SECONDS - minute * MINUTE_IN_SECONDS - second;
    }

    function toDays(uint timestamp) public pure returns (uint) {
        return timestamp / DAY_IN_SECONDS;
    }
}
