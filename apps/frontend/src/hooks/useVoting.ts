import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ProofGenerator, type VotingInput } from "@/circuits";
import VotingABI from "@/contracts/Voting.json";

const VOTING_CONTRACT_ADDRESS = VotingABI.address as `0x${string}`;

interface VoteAllocation {
  projectId: number;
  votes: number;
}

export function useVoting() {
  const { address } = useAccount();
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitVote = async (
    allocation: VoteAllocation,
    identity: { secret: bigint; nullifier: bigint },
    merkleProof: { pathIndices: number[]; siblings: bigint[] }
  ) => {
    if (!address) {
      setProofError("Wallet not connected");
      return;
    }

    setIsGeneratingProof(true);
    setProofError(null);

    try {
      const roundId = 1n;
      // Use projectId as externalNullifier to allow multiple votes per user (one per project)
      const externalNullifier = BigInt(allocation.projectId);

      const input: VotingInput = {
        identitySecret: identity.secret,
        identityNullifier: identity.nullifier,
        treePathIndices: merkleProof.pathIndices,
        treeSiblings: merkleProof.siblings,
        roundId,
        projectId: BigInt(allocation.projectId),
        voteCount: BigInt(allocation.votes),
        externalNullifier,
      };

      console.log("📥 Input to proof generator:", {
        roundId: roundId.toString(),
        projectId: allocation.projectId,
        voteCount: allocation.votes,
        externalNullifier: externalNullifier.toString(),
        pathIndicesLength: merkleProof.pathIndices.length,
        siblingsLength: merkleProof.siblings.length,
      });

      const proofGenerator = new ProofGenerator();
      const proof = await proofGenerator.generateProof(input);

      setIsGeneratingProof(false);

      console.log("🔍 Generated proof public signals:", {
        root: proof.publicSignals.root,
        nullifierHash: proof.publicSignals.nullifierHash,
        signalHash: proof.publicSignals.signalHash,
        externalNullifier: proof.publicSignals.externalNullifier,
        roundId: proof.publicSignals.roundId,
        projectId: proof.publicSignals.projectId,
        voteCount: proof.publicSignals.voteCount,
      });

      const pA: [bigint, bigint] = [BigInt(proof.proof.pi_a[0]), BigInt(proof.proof.pi_a[1])];

      const pB: [[bigint, bigint], [bigint, bigint]] = [
        [BigInt(proof.proof.pi_b[0][1]), BigInt(proof.proof.pi_b[0][0])],
        [BigInt(proof.proof.pi_b[1][1]), BigInt(proof.proof.pi_b[1][0])],
      ];

      const pC: [bigint, bigint] = [BigInt(proof.proof.pi_c[0]), BigInt(proof.proof.pi_c[1])];

      console.log("📝 Contract call args:", {
        root: BigInt(proof.publicSignals.root).toString(),
        nullifierHash: BigInt(proof.publicSignals.nullifierHash).toString(),
        signalHash: BigInt(proof.publicSignals.signalHash).toString(),
        externalNullifier: BigInt(proof.publicSignals.externalNullifier).toString(),
        roundId: BigInt(proof.publicSignals.roundId).toString(),
        projectId: BigInt(proof.publicSignals.projectId).toString(),
        voteCount: BigInt(proof.publicSignals.voteCount).toString(),
      });

      console.log("🔐 Proof points:", {
        pA: [pA[0].toString(), pA[1].toString()],
        pB: [
          [pB[0][0].toString(), pB[0][1].toString()],
          [pB[1][0].toString(), pB[1][1].toString()],
        ],
        pC: [pC[0].toString(), pC[1].toString()],
      });

      writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VotingABI.abi,
        functionName: "submitVote",
        args: [
          pA,
          pB,
          pC,
          BigInt(proof.publicSignals.root),
          BigInt(proof.publicSignals.nullifierHash),
          BigInt(proof.publicSignals.signalHash),
          BigInt(proof.publicSignals.externalNullifier),
          BigInt(proof.publicSignals.roundId),
          BigInt(proof.publicSignals.projectId),
          BigInt(proof.publicSignals.voteCount),
        ],
        gas: 5000000n, // Set reasonable gas limit
      });
    } catch (error) {
      setIsGeneratingProof(false);
      setProofError(error instanceof Error ? error.message : "Failed to generate proof");
      console.error("Proof generation error:", error);
    }
  };

  const calculateQuadraticCost = (votes: number): number => {
    return votes * votes;
  };

  const calculateTotalCost = (allocations: VoteAllocation[]): number => {
    return allocations.reduce((total, allocation) => {
      return total + calculateQuadraticCost(allocation.votes);
    }, 0);
  };

  return {
    submitVote,
    isGeneratingProof,
    isSubmitting: isPending,
    isConfirming,
    isSuccess,
    proofError,
    transactionHash: hash,
    calculateQuadraticCost,
    calculateTotalCost,
  };
}
