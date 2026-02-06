"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-background">
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
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
