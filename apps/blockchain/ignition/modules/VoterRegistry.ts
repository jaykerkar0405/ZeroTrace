import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VoterRegistryModule = buildModule("VoterRegistryModule", (m) => {
  const voterRegistry = m.contract("VoterRegistry");

  return { voterRegistry };
});

export default VoterRegistryModule;
