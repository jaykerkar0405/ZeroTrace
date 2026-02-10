"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Shield, ArrowLeft, CircleCheck, LoaderCircle } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogInWithAnonAadhaar,
  useAnonAadhaar,
  AnonAadhaarProof,
  useProver,
} from "@anon-aadhaar/react";
import { Badge } from "@/components/ui/badge";
import { VOTER_REGISTRY_ADDRESS, VOTER_REGISTRY_ABI } from "@/contracts";

export default function RegisterPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [anonAadhaar] = useAnonAadhaar();
  const [, latestProof] = useProver();
  const [isRegistering, setIsRegistering] = useState(false);
  const [nullifier, setNullifier] = useState<bigint | null>(null);
  const [nullifierSeed, setNullifierSeed] = useState<number | null>(null);
  const [storedNullifier, setStoredNullifier] = useState<string | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  const { data: isNullifierUsed } = useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: VOTER_REGISTRY_ABI,
    functionName: "isNullifierUsed",
    args: nullifier ? [nullifier] : undefined,
  });

  const { data: storedNullifierUsed, isLoading: isCheckingStored } = useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: VOTER_REGISTRY_ABI,
    functionName: "isNullifierUsed",
    args: storedNullifier ? [BigInt(storedNullifier)] : undefined,
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isConnected) {
      router.push("/connect");
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_nullifier");
      setStoredNullifier(saved);
      setHasCheckedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (hasCheckedStorage && storedNullifier && !isCheckingStored && storedNullifierUsed === true) {
      router.push("/dashboard");
    }
  }, [hasCheckedStorage, storedNullifier, storedNullifierUsed, isCheckingStored, router]);

  useEffect(() => {
    if (anonAadhaar?.status === "logged-in" && latestProof) {
      const proofNullifier = BigInt(latestProof.proof.nullifier);
      const proofNullifierSeed = Number(latestProof.proof.nullifierSeed);
      setNullifier(proofNullifier);
      setNullifierSeed(proofNullifierSeed);
    }
  }, [anonAadhaar, latestProof]);

  useEffect(() => {
    if (isConfirmed && nullifier && latestProof) {
      // Store basic registration data
      localStorage.setItem("user_nullifier", nullifier.toString());
      localStorage.setItem("user_proof", JSON.stringify(latestProof));
      localStorage.setItem("registration_timestamp", Date.now().toString());
      
      // Fetch voter proof data from the merkle tree service
      fetchVoterProofData(nullifier);
    }
  }, [isConfirmed, nullifier, latestProof, router]);

  const fetchVoterProofData = async (nullifier: bigint) => {
    try {
      // Call our backend API to get the voter proof data
      const response = await fetch('/api/voter/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nullifier: nullifier.toString() })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store voter identity and merkle proof
        localStorage.setItem("voterIdentity", JSON.stringify(data.identity));
        localStorage.setItem("merkleProof", JSON.stringify(data.merkleProof));
        localStorage.setItem("merkleRoot", data.merkleRoot);
        
        console.log("Voter proof data stored successfully");
      } else {
        console.error("Failed to fetch voter proof data");
      }
    } catch (error) {
      console.error("Error fetching voter proof data:", error);
    } finally {
      setIsRegistering(false);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    }
  };

  useEffect(() => {
    if (error) {
      setIsRegistering(false);
      console.error("Registration error:", error);
    }
  }, [error]);

  const handleRegisterVoter = async () => {
    if (!address || !nullifier || anonAadhaar?.status !== "logged-in") return;

    setIsRegistering(true);

    try {
      writeContract({
        address: VOTER_REGISTRY_ADDRESS,
        abi: VOTER_REGISTRY_ABI,
        functionName: "registerVoter",
        args: [nullifier],
      });
    } catch (err) {
      console.error("Registration failed:", err);
      setIsRegistering(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-background">
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="ZeroTrace Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-bold">ZeroTrace</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="hidden sm:inline-flex">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <ConnectButton />
            <ModeToggle />
          </div>
        </div>
      </nav>

      <main className="container py-10 sm:py-20">
        <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-6 sm:gap-8">
          <Card className="w-full max-w-2xl border-2">
            <CardHeader className="text-center">
              <Shield className="mx-auto h-16 w-16 text-primary" />
              <CardTitle className="text-2xl sm:text-3xl">Register as Voter</CardTitle>
              <CardDescription className="text-base">
                Complete your one-time registration to participate in quadratic funding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <CircleCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Step 1: Wallet Connected</h4>
                    <p className="text-sm text-muted-foreground">
                      Your wallet {address?.slice(0, 6)}...{address?.slice(-4)} is connected
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-4">
                  {anonAadhaar?.status === "logged-in" ? (
                    <CircleCheck className="h-5 w-5 text-primary mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">Step 2: Verify Identity</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate zero-knowledge proof using Anon Aadhaar
                    </p>
                    <div className="flex flex-col gap-4">
                      <LogInWithAnonAadhaar nullifierSeed={nullifierSeed ?? 1234567890} />
                      {anonAadhaar?.status === "logged-in" && nullifier && (
                        <div className="space-y-2">
                          <Badge variant="outline" className="w-fit gap-2">
                            <CircleCheck className="h-4 w-4" />
                            Identity Verified
                          </Badge>
                          {isNullifierUsed === true && (
                            <Badge variant="destructive" className="w-fit">
                              This identity is already registered
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {anonAadhaar?.status === "logged-in" && latestProof && (
                  <div className="rounded-lg border p-4 space-y-4">
                    <h4 className="font-semibold">Your Proof Details</h4>
                    <AnonAadhaarProof code={JSON.stringify(latestProof, null, 2)} />
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Privacy Guarantees</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ No Aadhaar number stored on-chain</li>
                    <li>✓ No personal information revealed</li>
                    <li>✓ Impossible to link wallet to real identity</li>
                    <li>✓ One person = One vote set</li>
                  </ul>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
                    <p className="text-sm text-destructive font-medium">
                      Registration failed: {error.message}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    anonAadhaar?.status !== "logged-in" ||
                    !nullifier ||
                    isNullifierUsed === true ||
                    isRegistering ||
                    isPending ||
                    isConfirming
                  }
                  onClick={handleRegisterVoter}
                >
                  {isRegistering || isPending || isConfirming ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      {isPending && "Confirm in wallet..."}
                      {isConfirming && "Registering on blockchain..."}
                      {!isPending && !isConfirming && "Processing..."}
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>

                {hash && (
                  <p className="text-xs text-muted-foreground text-center">
                    Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
