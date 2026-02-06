import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const circuitsDir = path.join(rootDir, 'circuits');
const projectRoot = path.resolve(rootDir, '../..');
const artifactsDir = path.join(rootDir, 'artifacts');
const frontendDir = path.join(projectRoot, 'apps/frontend/src/circuits');
const blockchainDir = path.join(projectRoot, 'apps/blockchain/contracts');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.basename(src)} to ${dest}`);
}

function compile() {
    console.log('Compiling circuits...\n');

    ensureDir(buildDir);
    ensureDir(artifactsDir);

    const circuits = [
        { name: 'voting', input: 'voting.circom' }
    ];

    for (const circuit of circuits) {
        console.log(`Compiling ${circuit.name}...`);

        const inputPath = path.join(circuitsDir, circuit.input);
        const outputDir = path.join(buildDir, circuit.name);

        ensureDir(outputDir);

        try {
            execSync(
                `circom ${inputPath} --r1cs --wasm --sym --c -o ${outputDir}`,
                { stdio: 'inherit', cwd: rootDir }
            );

            const r1csPath = path.join(outputDir, `${circuit.name}.r1cs`);

            console.log(`Generating zkey for ${circuit.name}...`);

            const ptauPath = path.join(artifactsDir, 'powersOfTau28_hez_final_16.ptau');

            if (!fs.existsSync(ptauPath)) {
                console.log('Downloading powers of tau...');
                execSync(
                    `curl -L -o ${ptauPath} https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_16.ptau`,
                    { stdio: 'inherit' }
                );
            }

            const zkeyPath = path.join(artifactsDir, `${circuit.name}.zkey`);
            const vkeyPath = path.join(artifactsDir, `${circuit.name}_vkey.json`);

            execSync(
                `snarkjs groth16 setup ${r1csPath} ${ptauPath} ${zkeyPath}`,
                { stdio: 'inherit' }
            );

            execSync(
                `snarkjs zkey export verificationkey ${zkeyPath} ${vkeyPath}`,
                { stdio: 'inherit' }
            );

            console.log(`Generating Solidity verifier for ${circuit.name}...`);
            const solidityPath = path.join(artifactsDir, `${circuit.name}Verifier.sol`);

            execSync(
                `snarkjs zkey export solidityverifier ${zkeyPath} ${solidityPath}`,
                { stdio: 'inherit' }
            );

            console.log(`\nCopying artifacts to frontend and blockchain...`);

            ensureDir(frontendDir);
            ensureDir(blockchainDir);

            const wasmSrcPath = path.join(outputDir, `${circuit.name}_js/`);
            const wasmDestPath = path.join(frontendDir, `${circuit.name}_js`);

            if (fs.existsSync(wasmDestPath)) {
                fs.rmSync(wasmDestPath, { recursive: true });
            }
            fs.cpSync(wasmSrcPath, wasmDestPath, { recursive: true });
            console.log(`Copied WASM files to frontend`);

            copyFile(zkeyPath, path.join(frontendDir, `${circuit.name}.zkey`));
            copyFile(vkeyPath, path.join(frontendDir, `${circuit.name}_vkey.json`));

            const frontendPublicDir = path.join(projectRoot, 'apps/frontend/public/circuits');
            ensureDir(frontendPublicDir);

            const publicWasmDestPath = path.join(frontendPublicDir, `${circuit.name}_js`);
            if (fs.existsSync(publicWasmDestPath)) {
                fs.rmSync(publicWasmDestPath, { recursive: true });
            }
            fs.cpSync(wasmSrcPath, publicWasmDestPath, { recursive: true });
            copyFile(zkeyPath, path.join(frontendPublicDir, `${circuit.name}.zkey`));
            console.log(`Copied artifacts to frontend public directory`);

            copyFile(solidityPath, path.join(blockchainDir, `${circuit.name.charAt(0).toUpperCase() + circuit.name.slice(1)}Verifier.sol`));

            console.log(`${circuit.name} compiled successfully\n`);
        } catch (error) {
            console.error(`Error compiling ${circuit.name}:`, error.message);
            process.exit(1);
        }
    }

    console.log('All circuits compiled successfully!');
}

compile();
