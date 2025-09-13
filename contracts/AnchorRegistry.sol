// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AnchorRegistry {
    event Anchored(bytes32 indexed hash, address indexed submitter, uint256 timestamp);
    function anchor(bytes32 hash) external {
        emit Anchored(hash, msg.sender, block.timestamp);
    }
}
