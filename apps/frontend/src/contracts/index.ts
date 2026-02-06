import VoterRegistryData from "./VoterRegistry.json";

export const VOTER_REGISTRY_ABI = VoterRegistryData.abi;
export const VOTER_REGISTRY_ADDRESS = VoterRegistryData.address as `0x${string}`;

export type NullifierData = {
  isUsed: boolean;
  registeredAt: bigint;
};
