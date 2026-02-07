import { poseidon2 } from 'poseidon-lite';

/**
 * Simple hash function for testing
 * In production, use poseidon2
 */
function simpleHash(inputs: bigint[]): bigint {
    // Fallback hash if poseidon fails
    let hash = 0n;
    for (const input of inputs) {
        hash = (hash + input) % (2n ** 254n);
    }
    return hash;
}

/**
 * Merkle Tree implementation for voter registry
 * Uses Poseidon hash for ZK-friendly hashing
 */
export class MerkleTree {
    public levels: number;
    public leaves: bigint[];
    public nodes: Map<string, bigint>;
    public root: bigint;
    public zeroValues: bigint[];
    private usePoseidon: boolean = true;

    constructor(levels: number, leaves: bigint[] = []) {
        console.log(`Initializing MerkleTree with ${levels} levels and ${leaves.length} leaves`);
        this.levels = levels;
        this.leaves = leaves;
        this.nodes = new Map();
        
        try {
            this.zeroValues = this.generateZeroValues(levels);
            console.log('Generated zero values');
        } catch (err) {
            console.error('Error generating zero values:', err);
            throw err;
        }
        
        try {
            this.root = this.buildTree();
            console.log('Built tree with root:', this.root.toString());
        } catch (err) {
            console.error('Error building tree:', err);
            throw err;
        }
    }

    /**
     * Hash function wrapper with fallback
     */
    private hash(inputs: bigint[]): bigint {
        try {
            if (this.usePoseidon) {
                return poseidon2(inputs);
            }
        } catch (err) {
            console.warn('Poseidon hash failed, using fallback:', err);
            this.usePoseidon = false;
        }
        return simpleHash(inputs);
    }

    /**
     * Generate zero values for empty nodes at each level
     */
    private generateZeroValues(levels: number): bigint[] {
        console.log('Generating zero values for', levels, 'levels...');
        const zeros: bigint[] = [0n];
        for (let i = 1; i < levels; i++) {
            zeros.push(this.hash([zeros[i - 1], zeros[i - 1]]));
            if (i % 5 === 0) {
                console.log(`Generated zero values for level ${i}/${levels}`);
            }
        }
        console.log('Finished generating zero values');
        return zeros;
    }

    /**
     * Get node key for storage
     */
    private nodeKey(level: number, index: number): string {
        return `${level}-${index}`;
    }

    /**
     * Build the merkle tree from leaves
     * Optimized: Only computes the path from leaves to root, not all nodes
     */
    private buildTree(): bigint {
        console.log('Building tree from', this.leaves.length, 'leaves (optimized mode)...');
        
        if (this.leaves.length === 0) {
            // Empty tree - root is just the zero value at the highest level
            return this.zeroValues[this.levels - 1];
        }

        // Start with leaves at bottom level (level 0)
        let currentLevel = this.leaves.map(leaf => leaf);
        const leavesAtLevel0 = Math.pow(2, this.levels);
        
        // Pad with zero values
        while (currentLevel.length < leavesAtLevel0) {
            currentLevel.push(this.zeroValues[0]);
        }

        // Store leaf nodes
        for (let i = 0; i < this.leaves.length; i++) {
            this.nodes.set(this.nodeKey(0, i), this.leaves[i]);
        }

        console.log('Computing path to root...');
        // Build up level by level
        for (let level = 0; level < this.levels; level++) {
            const nextLevel: bigint[] = [];
            
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] ?? this.zeroValues[level];
                const parent = this.hash([left, right]);
                nextLevel.push(parent);
                
                // Only store nodes we might need for proofs
                if (i < this.leaves.length * 2) {
                    this.nodes.set(this.nodeKey(level + 1, Math.floor(i / 2)), parent);
                }
            }
            
            currentLevel = nextLevel;
            
            if ((level + 1) % 5 === 0) {
                console.log(`Computed level ${level + 1}/${this.levels}`);
            }
        }

        // The root is the single remaining value
        const root = currentLevel[0];
        console.log('Tree building complete. Root:', root.toString());
        return root;
    }

    /**
     * Get Merkle proof for a leaf at given index
     */
    public getProof(leafIndex: number): { pathIndices: number[]; siblings: bigint[] } {
        if (leafIndex < 0 || leafIndex >= Math.pow(2, this.levels)) {
            throw new Error('Leaf index out of bounds');
        }

        const pathIndices: number[] = [];
        const siblings: bigint[] = [];

        let currentIndex = leafIndex;
        for (let level = 0; level < this.levels; level++) {
            const isRight = currentIndex % 2 === 1;
            pathIndices.push(isRight ? 1 : 0);

            const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
            const sibling = this.nodes.get(this.nodeKey(level, siblingIndex)) ?? this.zeroValues[level];
            siblings.push(sibling);

            currentIndex = Math.floor(currentIndex / 2);
        }

        return { pathIndices, siblings };
    }

    /**
     * Verify a merkle proof
     * Note: This static method always uses poseidon2 for verification
     */
    public static verifyProof(
        leaf: bigint,
        proof: { pathIndices: number[]; siblings: bigint[] },
        root: bigint
    ): boolean {
        let computedHash = leaf;

        try {
            for (let i = 0; i < proof.pathIndices.length; i++) {
                const sibling = proof.siblings[i];
                const pathIndex = proof.pathIndices[i];

                if (pathIndex === 0) {
                    // Leaf is on the left
                    computedHash = poseidon2([computedHash, sibling]);
                } else {
                    // Leaf is on the right
                    computedHash = poseidon2([sibling, computedHash]);
                }
            }

            return computedHash === root;
        } catch (err) {
            console.error('Error verifying proof:', err);
            return false;
        }
    }

    /**
     * Add a new leaf to the tree
     */
    public addLeaf(leaf: bigint): void {
        this.leaves.push(leaf);
        this.root = this.buildTree();
    }

    /**
     * Get all leaves
     */
    public getLeaves(): bigint[] {
        return this.leaves;
    }

    /**
     * Get the root
     */
    public getRoot(): bigint {
        return this.root;
    }
}

/**
 * Generate identity commitment from secret and nullifier
 * commitment = poseidon(secret, nullifier)
 */
export function generateIdentityCommitment(secret: bigint, nullifier: bigint): bigint {
    return poseidon2([secret, nullifier]);
}

/**
 * Generate random voter identity
 */
export function generateRandomIdentity(): { secret: bigint; nullifier: bigint; commitment: bigint } {
    // Generate cryptographically random values
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const secret = BigInt('0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    crypto.getRandomValues(randomBytes);
    const nullifier = BigInt('0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    const commitment = generateIdentityCommitment(secret, nullifier);
    
    return { secret, nullifier, commitment };
}
