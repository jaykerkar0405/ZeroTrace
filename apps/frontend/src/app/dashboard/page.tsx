"use client";

import Link from "next/link";
import { Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <ProtectedRoute>
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
          <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center gap-8">
            <Card className="w-full max-w-2xl border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Welcome to ZeroTrace Platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border-2 border-dashed p-12 text-center">
                  <Shield className="mx-auto h-16 w-16 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">Coming Soon</h3>
                  <p className="mt-2 text-muted-foreground">
                    The dashboard functionality is under development. Stay tuned for updates!
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Upcoming Features:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Voter Registration with Anon Aadhaar</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Browse Active Funding Rounds</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Submit Project Proposals</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Anonymous Voting Interface</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>View Voting Results & Fund Distribution</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center pt-4">
                  <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
