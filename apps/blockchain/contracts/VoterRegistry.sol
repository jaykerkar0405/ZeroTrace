// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VoterRegistry {
  struct NullifierInfo {
    bool isUsed;
    uint256 registeredAt;
  }

  mapping(uint256 => NullifierInfo) public nullifiers;

  uint256 public totalRegisteredVoters;
  uint256 public constant INITIAL_VOICE_CREDITS = 100;

  event VoterRegistered(uint256 indexed nullifier, uint256 timestamp);

  error NullifierAlreadyUsed(uint256 nullifier);
  error InvalidNullifier();

  function registerVoter(uint256 nullifier) external {
    if (nullifier == 0) {
      revert InvalidNullifier();
    }

    if (nullifiers[nullifier].isUsed) {
      revert NullifierAlreadyUsed(nullifier);
    }

    nullifiers[nullifier] = NullifierInfo({registeredAt: block.timestamp, isUsed: true});

    totalRegisteredVoters++;

    emit VoterRegistered(nullifier, block.timestamp);
  }

  function isNullifierUsed(uint256 nullifier) external view returns (bool) {
    return nullifiers[nullifier].isUsed;
  }

  function getNullifierData(
    uint256 nullifier
  ) external view returns (uint256 registeredAt, bool isUsed) {
    NullifierInfo memory info = nullifiers[nullifier];
    return (info.registeredAt, info.isUsed);
  }

  function getTotalRegisteredVoters() external view returns (uint256) {
    return totalRegisteredVoters;
  }

  function getInitialVoiceCredits() external pure returns (uint256) {
    return INITIAL_VOICE_CREDITS;
  }
}
