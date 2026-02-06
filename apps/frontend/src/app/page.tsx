"use client";

import {
  Eye,
  Zap,
  Lock,
  Vote,
  Files,
  Users,
  Shield,
  Github,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-background">
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="ZeroTrace Logo" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-bold">ZeroTrace</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="ghost">How It Works</Button>
            </Link>
            <Link href="#architecture">
              <Button variant="ghost">Architecture</Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </nav>

      <main className="container">
        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 py-20 text-center">
          <Badge variant="outline" className="px-4 py-1">
            Privacy-Preserving Quadratic Funding
          </Badge>
          <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            Fair Funding.
            <br />
            Private Voting.
            <br />
            <span className="text-primary">Verified Humans.</span>
          </h1>
          <p className="max-w-175 text-lg text-muted-foreground sm:text-xl">
            A decentralized platform that enables communities to fairly allocate treasury funds
            while maintaining complete voter anonymity and preventing sybil attacks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://github.com/jaykerkar0405/ZeroTrace" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2">
                GitHub <Github className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="secondary">Key Features</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why ZeroTrace?
            </h2>
            <p className="max-w-175 text-muted-foreground">
              Combining cutting-edge zero-knowledge technology with democratic funding mechanisms
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle>Sybil Resistant</CardTitle>
                <CardDescription>
                  Anon Aadhaar integration ensures one person equals one vote without revealing
                  identity
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Eye className="h-10 w-10 text-primary" />
                <CardTitle>Complete Privacy</CardTitle>
                <CardDescription>
                  Semaphore protocol guarantees vote anonymity. No one can trace who voted for what
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle>Quadratic Fairness</CardTitle>
                <CardDescription>
                  Prevents whale domination. 1,000 small voters outweigh one wealthy holder
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary" />
                <CardTitle>Automated Distribution</CardTitle>
                <CardDescription>
                  Smart contracts automatically allocate funds based on quadratic voting results
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 text-primary" />
                <CardTitle>Zero Knowledge Proofs</CardTitle>
                <CardDescription>
                  Cryptographic verification without revealing any personal information on-chain
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Vote className="h-10 w-10 text-primary" />
                <CardTitle>Democratic Governance</CardTitle>
                <CardDescription>
                  Every community member has meaningful influence in funding decisions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="secondary">Process</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="max-w-175 text-muted-foreground">
              Four simple steps to participate in fair funding allocation
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <CardTitle>Register Once</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Connect wallet
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Verify with Anon Aadhaar
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Receive 100 voice credits
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    No personal data stored
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <CardTitle>Browse Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    View active proposals
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Read project details
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Check funding requests
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    See current vote counts
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <CardTitle>Vote Anonymously</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Allocate voice credits
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Quadratic cost: n² credits
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Generate ZK proof
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Submit anonymously
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <CardTitle>Funds Distributed</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Quadratic scores calculated
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Proportional allocation
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Automated transfers
                  </li>
                  <li className="flex gap-2">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    Full transparency
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="architecture" className="py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="secondary">Technology</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Three-Layer Architecture
            </h2>
            <p className="max-w-175 text-muted-foreground">
              Built on proven cryptographic primitives and democratic mechanisms
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    1
                  </div>
                  Identity Layer
                </CardTitle>
                <CardDescription className="text-base font-semibold">Anon Aadhaar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ensures one person equals one vote set without revealing identity
                </p>
                <div className="pt-2">
                  <Badge>Sybil Resistant</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    2
                  </div>
                  Privacy Layer
                </CardTitle>
                <CardDescription className="text-base font-semibold">
                  Semaphore Protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Guarantees complete anonymity in vote allocation and submission
                </p>
                <div className="pt-2">
                  <Badge>Zero Knowledge</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    3
                  </div>
                  Distribution Layer
                </CardTitle>
                <CardDescription className="text-base font-semibold">
                  Quadratic Funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Prevents plutocratic capture and enables democratic resource allocation
                </p>
                <div className="pt-2">
                  <Badge>Fair Mechanism</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20">
          <div className="flex flex-col items-center gap-8 rounded-lg border-2 bg-muted/50 p-8 text-center md:p-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Experience Fair Funding?
            </h2>
            <p className="max-w-150 text-muted-foreground">
              Join the revolution in democratic governance. Start allocating funds fairly while
              maintaining your privacy.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Launch App <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://github.com/jaykerkar0405/ZeroTrace/blob/main/README.md" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  Read Documentation <Files className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ZeroTrace Logo" width={24} height={24} className="h-6 w-6" />
            <span className="text-sm font-semibold">ZeroTrace</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for fair and private governance
          </p>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
