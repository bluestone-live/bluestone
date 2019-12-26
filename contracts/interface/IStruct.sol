pragma solidity ^0.6.0;

interface IStruct {
    struct DepositRecord {
        bytes32 depositId;
        address ownerAddress;
        address tokenAddress;
        uint256 depositTerm;
        uint256 depositAmount;
        uint256 poolId;
        uint256 createdAt;
        uint256 maturedAt;
        uint256 withdrewAt;
        uint256 weight;
        address distributorAddress;
    }
}
