// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

interface IWhitelist {
    // Whitelist events
    event AddKeeperWhitelisted(address indexed account);
    event RemoveKeeperWhitelisted(address indexed account);
    event AddLenderWhitelisted(address indexed account);
    event RemoveLenderWhitelisted(address indexed account);
    event AddBorrowerWhitelisted(address indexed account);
    event RemoveBorrowerWhitelisted(address indexed account);

    /// Whitelist Getter

    /// @notice Whitelisted keepers getter
    function getWhitelistedKeepers() external view returns (address[] memory);

    /// @notice Whitelisted lenders getter
    function getWhitelistedLenders() external view returns (address[] memory);

    /// @notice Whitelisted borrowers getter
    function getWhitelistedBorrowers() external view returns (address[] memory);

    /// @notice Add account to whitelistedKeepers
    /// @param account Account address
    function addKeeperWhitelisted(address account) external;

    /// @notice Remove account from whitelistedKeepers
    /// @param account Account address
    function removeKeeperWhitelisted(address account) external;

    /// @notice Add account to whitelistedLenders
    /// @param account Account address
    function addLenderWhitelisted(address account) external;

    /// @notice Remove account from whitelistedLenders
    /// @param account Account address
    function removeLenderWhitelisted(address account) external;

    /// @notice Add account to whitelistedBorrowers
    /// @param account Account address
    function addBorrowerWhitelisted(address account) external;

    /// @notice Remove account from whitelistedBorrowers
    /// @param account Account address
    function removeBorrowerWhitelisted(address account) external;
}
