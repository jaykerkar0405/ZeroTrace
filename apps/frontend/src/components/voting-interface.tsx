"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVoting } from "@/hooks/useVoting";
import { Loader2, Plus, Minus, CheckCircle, AlertCircle } from "lucide-react";

interface Project {
  id: number;
  owner: string;
  title: string;
  description: string;
  category: string;
  requestedFunding: number;
  receivedFunding: number;
  totalVotes: number;
  createdAt: number;
  status: number;
  metadataURI: string;
}

interface VoteAllocation {
  projectId: number;
  votes: number;
}

const VOICE_CREDITS = 100;

export default function VotingInterface({ projects }: { projects: Project[] }) {
  const [allocations, setAllocations] = useState<Map<number, number>>(new Map());
  const [identity, setIdentity] = useState<{ secret: bigint; nullifier: bigint } | null>(null);
  const [merkleProof, setMerkleProof] = useState<{
    pathIndices: number[];
    siblings: bigint[];
  } | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<bigint | null>(null);

  const {
    submitVote,
    isGeneratingProof,
    isSubmitting,
    isConfirming,
    isSuccess,
    proofError,
    transactionHash,
    calculateQuadraticCost,
    calculateTotalCost,
  } = useVoting();

  useEffect(() => {
    const storedIdentity = localStorage.getItem("voterIdentity");
    if (storedIdentity) {
      const parsed = JSON.parse(storedIdentity);
      setIdentity({
        secret: BigInt(parsed.secret),
        nullifier: BigInt(parsed.nullifier),
      });
    }

    const storedProof = localStorage.getItem("merkleProof");
    if (storedProof) {
      const parsed = JSON.parse(storedProof);
      setMerkleProof({
        pathIndices: parsed.pathIndices,
        siblings: parsed.siblings.map((s: string) => BigInt(s)),
      });
    }

    const storedRoot = localStorage.getItem("merkleRoot");
    if (storedRoot) {
      setMerkleRoot(BigInt(storedRoot));
    }
  }, []);

  const updateVotes = (projectId: number, change: number) => {
    const current = allocations.get(projectId) || 0;
    const newValue = Math.max(0, current + change);

    const newAllocations = new Map(allocations);
    if (newValue === 0) {
      newAllocations.delete(projectId);
    } else {
      newAllocations.set(projectId, newValue);
    }

    setAllocations(newAllocations);
  };

  const getAllocations = (): VoteAllocation[] => {
    return Array.from(allocations.entries()).map(([projectId, votes]) => ({
      projectId,
      votes,
    }));
  };

  const totalCost = calculateTotalCost(getAllocations());
  const remainingCredits = VOICE_CREDITS - totalCost;

  const handleSubmitVote = async (projectId: number) => {
    if (!identity || !merkleProof || !merkleRoot) {
      alert("Please register as a voter first");
      return;
    }

    const votes = allocations.get(projectId);
    if (!votes) return;

    await submitVote({ projectId, votes }, identity, merkleProof);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Vote on Projects</h1>
        <p className="text-muted-foreground mb-4">
          Allocate your voice credits to support public good projects. Each vote costs quadratically
          more credits.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Your Voice Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">
                  {remainingCredits} / {VOICE_CREDITS}
                </p>
                <p className="text-sm text-muted-foreground">Available Credits</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalCost}</p>
                <p className="text-sm text-muted-foreground">Used Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {proofError && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{proofError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSuccess && transactionHash && (
        <Card className="mb-4 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Vote submitted successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6">
        {projects.map((project) => {
          const votes = allocations.get(project.id) || 0;
          const cost = calculateQuadraticCost(votes);
          const canAdd = remainingCredits >= calculateQuadraticCost(votes + 1) - cost;

          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{project.title}</CardTitle>
                      <Badge variant="outline">{project.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Votes: {project.totalVotes}</span>
                      <span>•</span>
                      <span>
                        Owner: {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    ${(project.requestedFunding / 1e18).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateVotes(project.id, -1)}
                      disabled={votes === 0 || isGeneratingProof || isSubmitting}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <div className="text-center min-w-[60px] sm:min-w-[100px]">
                      <p className="text-2xl font-bold">{votes}</p>
                      <p className="text-xs text-muted-foreground">votes</p>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateVotes(project.id, 1)}
                      disabled={!canAdd || isGeneratingProof || isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-base sm:text-lg font-semibold">{cost} credits</p>
                    <p className="text-xs text-muted-foreground">
                      Next vote: +{calculateQuadraticCost(votes + 1) - cost} credits
                    </p>
                  </div>

                  <Button
                    onClick={() => handleSubmitVote(project.id)}
                    disabled={votes === 0 || isGeneratingProof || isSubmitting || isConfirming}
                  >
                    {isGeneratingProof && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isGeneratingProof
                      ? "Generating Proof..."
                      : isSubmitting
                        ? "Submitting..."
                        : isConfirming
                          ? "Confirming..."
                          : "Submit Vote"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
