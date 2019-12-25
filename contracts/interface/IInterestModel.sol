pragma solidity ^0.6.0;

interface IInterestModel {
    function getDepositWeight(uint256 amount, uint256 term)
        external
        pure
        virtual
        returns (uint256 depositWeight);

    function getLoanInterestRate(
        address tokenAddress,
        uint256 loanTerm,
        uint256 maxTerm
    ) external view virtual returns (uint256 loanInterestRate);
}
