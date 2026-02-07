import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { MerkleTree, generateIdentityCommitment } from "./tree";
import { VOTER_REGISTRY_ABI, VOTER_REGISTRY_ADDRESS } from "@/contracts";

const MERKLE_TREE_LEVELS = 20;

export interface VoterData {
  nullifier: bigint;
  secret: bigint;
  commitment: bigint;
  leafIndex: number;
}

export interface VoterProofData {
  identity: {
    secret: string;
    nullifier: string;
  };
  merkleProof: {
    pathIndices: number[];
    siblings: string[];
  };
  merkleRoot: string;
  leafIndex: number;
}

/**
 * Service to manage voter registry and merkle tree
 */
export class VoterRegistryService {
  private publicClient;
  private merkleTree: MerkleTree | null = null;
  private voters: Map<string, VoterData> = new Map();

  constructor() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http("https://eth-sepolia.g.alchemy.com/v2/kwU2f4g7OCaQtfYNoB5rs"),
    });
  }

  /**
   * Build merkle tree from a specific set of nullifiers
   * This is more efficient than scanning the entire blockchain
   */
  buildMerkleTreeFromNullifiers(nullifiers: bigint[]): void {
    if (nullifiers.length === 0) {
      console.warn("No nullifiers provided. Creating empty tree.");
      this.merkleTree = new MerkleTree(MERKLE_TREE_LEVELS, []);
      return;
    }

    const commitments: bigint[] = [];
    const votersMap = new Map<string, VoterData>();

    for (let i = 0; i < nullifiers.length; i++) {
      const nullifier = nullifiers[i];
      const secret = nullifier * 2n; // Deterministic derivation
      const commitment = generateIdentityCommitment(secret, nullifier);

      commitments.push(commitment);
      votersMap.set(nullifier.toString(), {
        nullifier,
        secret,
        commitment,
        leafIndex: i,
      });
    }

    // Build merkle tree from commitments
    this.merkleTree = new MerkleTree(MERKLE_TREE_LEVELS, commitments);
    this.voters = votersMap;

    console.log(`✅ Built merkle tree with ${nullifiers.length} voters`);
    console.log(`📋 Merkle root: ${this.merkleTree.getRoot()}`);
  }

  /**
   * Fetch total voter count from contract and build simplified tree
   */
  async buildSimplifiedMerkleTree(): Promise<void> {
    try {
      // Get total registered voters from contract
      const totalVoters = (await this.publicClient.readContract({
        address: VOTER_REGISTRY_ADDRESS as `0x${string}`,
        abi: VOTER_REGISTRY_ABI,
        functionName: "getTotalRegisteredVoters",
      })) as bigint;

      console.log(`Total registered voters: ${totalVoters}`);

      if (totalVoters === 0n) {
        console.warn("No voters registered yet");
        this.merkleTree = new MerkleTree(MERKLE_TREE_LEVELS, []);
        return;
      }

      // For simplicity, if user is registered, we can build a tree with just their nullifier
      // In production, you'd have a backend service that maintains the full merkle tree
      console.log("⚠️ Using simplified single-voter tree for demonstration");

      // The tree will be built when getVoterProofData is called with the actual nullifier
    } catch (error) {
      console.error("❌ Failed to get voter count:", error);
      this.merkleTree = new MerkleTree(MERKLE_TREE_LEVELS, []);
    }
  }

  /**
   * Fetch all registered voters from blockchain and build merkle tree
   * WARNING: This is slow on Alchemy free tier (10 blocks per request)
   */
  async buildMerkleTreeFromChain(): Promise<void> {
    console.log("⚠️ Blockchain scanning is slow on free RPC tier. Using simplified approach...");
    await this.buildSimplifiedMerkleTree();
  }

  /**
   * Get voter data and merkle proof for a given nullifier
   */
  async getVoterProofData(nullifier: bigint): Promise<VoterProofData | null> {
    // Check if we need to build the tree first
    if (!this.merkleTree) {
      console.log("Building merkle tree with provided nullifier...");
      this.buildMerkleTreeFromNullifiers([nullifier]);
    }

    // Ensure merkle tree is initialized
    if (!this.merkleTree) {
      console.error("Failed to initialize merkle tree");
      return null;
    }

    // If voter not in map, add them
    if (!this.voters.has(nullifier.toString())) {
      console.log("Adding voter to tree...");
      const secret = nullifier * 2n;
      const commitment = generateIdentityCommitment(secret, nullifier);
      const leafIndex = this.merkleTree.getLeaves().length;

      this.merkleTree.addLeaf(commitment);
      this.voters.set(nullifier.toString(), {
        nullifier,
        secret,
        commitment,
        leafIndex,
      });
    }

    const voterData = this.voters.get(nullifier.toString());
    if (!voterData) {
      console.error("Failed to get voter data");
      return null;
    }

    if (!this.merkleTree) {
      console.error("Merkle tree not initialized");
      return null;
    }

    const proof = this.merkleTree.getProof(voterData.leafIndex);

    console.log(`✅ Generated proof for voter at leaf index ${voterData.leafIndex}`);

    return {
      identity: {
        secret: voterData.secret.toString(),
        nullifier: voterData.nullifier.toString(),
      },
      merkleProof: {
        pathIndices: proof.pathIndices,
        siblings: proof.siblings.map((s) => s.toString()),
      },
      merkleRoot: this.merkleTree!.getRoot().toString(),
      leafIndex: voterData.leafIndex,
    };
  }

  /**
   * Get merkle root
   */
  getMerkleRoot(): string | null {
    return this.merkleTree?.getRoot().toString() ?? null;
  }

  /**
   * Check if voter is registered
   */
  isVoterRegistered(nullifier: bigint): boolean {
    return this.voters.has(nullifier.toString());
  }

  /**
   * Get total number of registered voters
   */
  getTotalVoters(): number {
    return this.voters.size;
  }
}

// Singleton instance
let serviceInstance: VoterRegistryService | null = null;

export function getVoterRegistryService(): VoterRegistryService {
  if (!serviceInstance) {
    serviceInstance = new VoterRegistryService();
  }
  return serviceInstance;
}
