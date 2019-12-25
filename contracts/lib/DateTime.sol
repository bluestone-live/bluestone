pragma solidity ^0.6.0;

/// Unix timestamp conversion utilities
/// To learn more, try this online converter: https://www.epochconverter.com/
library DateTime {
    uint256 constant DAY_IN_SECONDS = 86400;
    uint256 constant HOUR_IN_SECONDS = 3600;
    uint256 constant MINUTE_IN_SECONDS = 60;

    function dayInSeconds() public pure returns (uint256) {
        return 86400;
    }

    function getHour(uint256 timestamp) public pure returns (uint8) {
        return uint8((timestamp / 60 / 60) % 24);
    }

    function getMinute(uint256 timestamp) public pure returns (uint8) {
        return uint8((timestamp / 60) % 60);
    }

    function getSecond(uint256 timestamp) public pure returns (uint8) {
        return uint8(timestamp % 60);
    }

    function secondsUntilMidnight(uint256 timestamp)
        public
        pure
        returns (uint256)
    {
        uint8 hour = getHour(timestamp);
        uint8 minute = getMinute(timestamp);
        uint8 second = getSecond(timestamp);

        return
            DAY_IN_SECONDS -
            hour *
            HOUR_IN_SECONDS -
            minute *
            MINUTE_IN_SECONDS -
            second;
    }

    function toDays() external view returns (uint256) {
        return toDays(now);
    }

    function toDays(uint256 timestamp) public pure returns (uint256) {
        return timestamp / DAY_IN_SECONDS;
    }

    function to3Minutes(uint256 timestamp) external pure returns (uint256) {
        return uint256(timestamp % DAY_IN_SECONDS) / MINUTE_IN_SECONDS / 3;
    }
}
