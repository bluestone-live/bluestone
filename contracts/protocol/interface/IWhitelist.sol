pragma solidity ^0.6.7;

interface IWhitelist {
    /// Whitelist Getter

    /// @notice Whitelisted administrators getter
    function getAdministrators() external view returns (address[] memory);

    /// @notice Whitelisted lenders getter
    function getWhitelistedLenders() external view returns (address[] memory);

    /// @notice Whitelisted borrowers getter
    function getWhitelistedBorrowers() external view returns (address[] memory);

    /// Option for Administrators

    /// @notice Add account to administrators
    /// @param account Account address
    function addAdministrator(address account) external;

    /// @notice Remove account from administrators
    /// @param account Account address
    function removeAdministrator(address account) external;

    /// Option for Lenders

    /// @notice Add account to whitelistedLenders
    /// @param account Account address
    function addLenderWhitelisted(address account) external;

    /// @notice Remove account from whitelistedLenders
    /// @param account Account address
    function removeLenderWhitelisted(address account) external;

    /// Option for Borrowers

    /// @notice Add account to whitelistedBorrowers
    /// @param account Account address
    function addBorrowerWhitelisted(address account) external;

    /// @notice Remove account from whitelistedBorrowers
    /// @param account Account address
    function removeBorrowerWhitelisted(address account) external;
}
