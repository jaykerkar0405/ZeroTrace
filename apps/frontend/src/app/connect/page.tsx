"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Shield, ArrowLeft } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VOTER_REGISTRY_ADDRESS, VOTER_REGISTRY_ABI } from "@/contracts";

export default function ConnectPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [storedNullifier, setStoredNullifier] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_nullifier");
      setStoredNullifier(saved);
    }
  }, []);

  const { data: isRegistered, isLoading } = useReadContract({
    address: VOTER_REGISTRY_ADDRESS,
    abi: VOTER_REGISTRY_ABI,
    functionName: "isNullifierUsed",
    args: storedNullifier ? [BigInt(storedNullifier)] : undefined,
  });

  useEffect(() => {
    if (isConnected && address && !isLoading) {
      if (storedNullifier && isRegistered) {
        // Returning voter - go to dashboard
        router.push("/dashboard");
      } else {
        // New voter - go to registration
        router.push("/register");
      }
    }
  }, [isConnected, address, isRegistered, isLoading, storedNullifier, router]);

  return (
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
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </nav>

      <main className="container py-20">
        <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-8">
          <Card className="w-full max-w-lg border-2">
            <CardHeader className="text-center">
              <Shield className="mx-auto h-16 w-16 text-primary" />
              <CardTitle className="text-3xl">Connect Your Wallet</CardTitle>
              <CardDescription className="text-base">
                Connect your wallet to access the ZeroTrace platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <ConnectButton />
              </div>

              <div className="space-y-4">
                <h4 className="text-center font-semibold">Why connect your wallet?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Register as a verified voter with Anon Aadhaar</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Participate in quadratic funding rounds</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Vote anonymously on project proposals</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Submit your own projects for funding</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Privacy Notice:</strong> Your wallet address is used only for
                  authentication. All votes are completely anonymous through zero-knowledge proofs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
