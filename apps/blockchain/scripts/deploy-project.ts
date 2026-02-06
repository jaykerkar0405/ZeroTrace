import fs from "fs";
import path from "path";
import { ethers, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`Deploying Project contract to ${networkName}...`);

    const Project = await ethers.getContractFactory("Project");
    const project = await Project.deploy();
    await project.waitForDeployment();

    const address = await project.getAddress();
    console.log(`Project deployed to: ${address}`);
    console.log(`Network: ${networkName}`);

    const contractData = {
        address: address,
        abi: JSON.parse(project.interface.formatJson()),
    };

    const frontendPath = path.join(
        __dirname,
        "../../frontend/src/contracts/Project.json"
    );

    fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
    fs.writeFileSync(frontendPath, JSON.stringify(contractData, null, 2));

    console.log(`Contract ABI and address saved to: ${frontendPath}`);

    // Verify deployment
    console.log("\nVerifying deployment...");
    const projectCount = await project.projectCount();
    console.log("Initial project count:", projectCount.toString());

    if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("\nWaiting for block confirmations...");
        await project.deploymentTransaction()?.wait(5);
        console.log("Block confirmations received!");
    }

    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log("Contract: Project");
    console.log("Address:", address);
    console.log("Network:", networkName);
    console.log("\nNext steps:");
    console.log("1. Contract exports have been updated automatically");
    console.log("2. Test project submission on the frontend");
    console.log("3. Configure Pinata JWT in .env.local if not done yet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
