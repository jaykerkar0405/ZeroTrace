"use client";

import Link from "next/link";
import Image from "next/image";
import { Shield, Home, CheckCircle2, Vote, Users, Coins, Rocket, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount, useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VOTER_REGISTRY_ADDRESS, VOTER_REGISTRY_ABI } from "@/contracts";

export default function Dashboard() {
  const router = useRouter();
  const { address } = useAccount();
  const [storedNullifier, setStoredNullifier] = useState<string | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_nullifier");
      setStoredNullifier(saved);
      setHasCheckedStorage(true);
    }
  }, []);

  const { data: isRegistered, isLoading: isLoadingRegistration } = useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: VOTER_REGISTRY_ABI,
    functionName: "isNullifierUsed",
    args: storedNullifier ? [BigInt(storedNullifier)] : undefined,
  });

  const { data: nullifierData, isLoading: isLoadingVoterData } = useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: VOTER_REGISTRY_ABI,
    functionName: "getNullifierData",
    args: storedNullifier ? [BigInt(storedNullifier)] : undefined,
  });

  const { data: totalVoters } = useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: VOTER_REGISTRY_ABI,
    functionName: "getTotalRegisteredVoters",
  });

  useEffect(() => {
    if (hasCheckedStorage && (!storedNullifier || (!isLoadingRegistration && !isRegistered))) {
      router.push("/register");
    }
  }, [hasCheckedStorage, isRegistered, isLoadingRegistration, storedNullifier, router]);

  if (isLoadingRegistration || isLoadingVoterData || !isRegistered || !nullifierData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen max-w-7xl mx-auto bg-background flex items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-primary animate-pulse" />
            <p className="mt-4 text-muted-foreground">Loading voter data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const [registeredAt] = nullifierData as [bigint, boolean];
  const voiceCredits = BigInt(100); // INITIAL_VOICE_CREDITS constant from contract

  return (
    <ProtectedRoute>
      <div className="min-h-screen max-w-7xl mx-auto bg-background">
        <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ZeroTrace Logo" width={32} height={32} className="h-8 w-8" />
              <span className="text-xl font-bold">ZeroTrace</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <ConnectButton />
              <ModeToggle />
            </div>
          </div>
        </nav>

        <main className="container py-20">
          <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-2">Welcome to ZeroTrace Platform</p>
              </div>
              <Badge variant="outline" className="gap-2 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Verified Voter
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Registration Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Registered on {new Date(Number(registeredAt) * 1000).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5" />
                    Voice Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{voiceCredits.toString()}</p>
                  <p className="text-sm text-muted-foreground">Available for voting</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Total Voters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalVoters?.toString() || "0"}</p>
                  <p className="text-sm text-muted-foreground">Registered voters</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Submit Your Project
                  </CardTitle>
                  <CardDescription>
                    Request funding for your public goods project
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    Have a project idea that benefits the ecosystem? Submit your proposal and get funded through quadratic funding.
                  </p>
                  <Link href="/dashboard/submit-project">
                    <Button className="w-full gap-2">
                      <Rocket className="h-4 w-4" />
                      Submit Project Proposal
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Browse Projects
                  </CardTitle>
                  <CardDescription>
                    Discover and support public goods projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    Explore active projects seeking funding and contribute to the ones that matter to you.
                  </p>
                  <Link href="/dashboard/projects">
                    <Button variant="outline" className="w-full gap-2">
                      <FolderKanban className="h-4 w-4" />
                      View All Projects
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Your Voter Identity</CardTitle>
                <CardDescription>
                  Your verified identity secured with zero-knowledge proofs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold text-sm mb-2">Wallet Address</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {address?.slice(0, 10)}...{address?.slice(-8)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold text-sm mb-2">Verification Status</h4>
                    <Badge variant="outline" className="gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Anon Aadhaar Verified
                    </Badge>
                  </div>
                  <div className="rounded-lg border p-4 md:col-span-2">
                    <h4 className="font-semibold text-sm mb-2">Nullifier (Anonymous ID)</h4>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {storedNullifier ? `${storedNullifier.slice(0, 20)}...${storedNullifier.slice(-20)}` : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-semibold text-sm mb-2">Privacy Guarantees</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Your votes are completely anonymous</li>
                    <li>✓ No one can link your wallet to your real identity</li>
                    <li>✓ Sybil-resistant through Anon Aadhaar</li>
                    <li>✓ One person = One vote set</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm mb-2">On-Chain Verification</h4>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    Contract: {VOTER_REGISTRY_ADDRESS}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Funding Rounds
                </CardTitle>
                <CardDescription>Participate in quadratic funding rounds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed p-12 text-center">
                  <Vote className="mx-auto h-16 w-16 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No Active Rounds</h3>
                  <p className="mt-2 text-muted-foreground">
                    There are currently no active funding rounds. Check back later!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
