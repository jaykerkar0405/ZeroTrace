import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";

async function main() {
  const networkName = network.name;
  console.log(`Deploying VoterRegistry contract to ${networkName}...`);

  const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
  const voterRegistry = await VoterRegistry.deploy();
  await voterRegistry.waitForDeployment();

  const address = await voterRegistry.getAddress();
  console.log(`VoterRegistry deployed to: ${address}`);
  console.log(`Network: ${networkName}`);

  const contractData = {
    address: address,
    abi: JSON.parse(voterRegistry.interface.formatJson()),
  };

  const frontendPath = path.join(
    __dirname,
    "../../frontend/src/contracts/VoterRegistry.json"
  );

  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(contractData, null, 2));

  console.log(`Contract ABI and address saved to: ${frontendPath}`);

  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    await voterRegistry.deploymentTransaction()?.wait(5);
    console.log("Block confirmations received!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
