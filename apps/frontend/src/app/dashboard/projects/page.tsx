"use client";

import { useState, useEffect } from "react";
import { useReadContract, useAccount } from "wagmi";
import {
  Shield,
  Home,
  Search,
  Plus,
  ArrowLeft,
  FolderKanban,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProtectedRoute } from "@/components/protected-route";
import { fetchFromIPFS } from "@/lib/storage/ipfs";
import { Project, ProjectMetadata, ProjectStatus } from "@/types";
import { PROJECT_ABI, PROJECT_ADDRESS } from "@/contracts";
import { useVoting } from "@/hooks/useVoting";
import VotingABI from "@/contracts/Voting.json";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [allocations, setAllocations] = useState<Map<number, number>>(new Map());
  const [identity, setIdentity] = useState<{ secret: bigint; nullifier: bigint } | null>(null);
  const [merkleProof, setMerkleProof] = useState<{
    pathIndices: number[];
    siblings: bigint[];
  } | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<bigint | null>(null);
  const [projectVotes, setProjectVotes] = useState<Map<number, number>>(new Map());
  const { address } = useAccount();
  const VOICE_CREDITS = 100;

  const {
    submitVote,
    isGeneratingProof,
    isSubmitting,
    isConfirming,
    isSuccess,
    proofError,
    transactionHash,
    calculateTotalCost,
  } = useVoting();

  // Read all projects from contract
  const {
    data: allProjectsData,
    isLoading,
    refetch: refetchProjects,
  } = useReadContract({
    address: PROJECT_ADDRESS,
    abi: PROJECT_ABI,
    functionName: "getAllProjects",
  });

  // Read voter credits from contract
  const { data: voterCreditsData, refetch: refetchCredits } = useReadContract({
    address: VotingABI.address as `0x${string}`,
    abi: VotingABI.abi,
    functionName: "voterCreditsPerRound",
    args: [address, 1n], // roundId = 1
  });

  useEffect(() => {
    if (allProjectsData && Array.isArray(allProjectsData)) {
      loadProjects(allProjectsData as any[]);
    }
  }, [allProjectsData]);

  // Fetch vote counts when projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      console.log("📊 Fetching votes for project IDs:", projectIds);
      fetchProjectVotes(projectIds);
    }
  }, [projects]);

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

  const fetchProjectVotes = async (projectIds: number[]) => {
    const votesMap = new Map<number, number>();
    const { readContract } = await import("wagmi/actions");
    const { getConfig } = await import("@/lib/wagmi");
    const config = getConfig();

    console.log("🗳️ Fetching votes from contract:", VotingABI.address);

    for (const projectId of projectIds) {
      try {
        console.log(`🗳️ Fetching votes for project ${projectId}...`);
        const votes = (await readContract(config, {
          address: VotingABI.address as `0x${string}`,
          abi: VotingABI.abi,
          functionName: "getProjectVotes",
          args: [1n, BigInt(projectId)], // roundId = 1
        })) as bigint;
        console.log(`🗳️ Project ${projectId} votes:`, votes.toString());
        votesMap.set(projectId, Number(votes));
      } catch (error) {
        console.error(`❌ Failed to fetch votes for project ${projectId}:`, error);
        votesMap.set(projectId, 0);
      }
    }
    console.log("🗳️ All votes fetched:", Object.fromEntries(votesMap));
    setProjectVotes(new Map(votesMap));
  };

  // Reset allocations and refetch projects after successful vote
  useEffect(() => {
    if (isSuccess && transactionHash) {
      console.log("✅ Vote successful! Resetting allocations and refreshing data...");
      // Refetch credits first, then reset allocations to avoid stale display
      refetchCredits().then(() => {
        setAllocations(new Map());
      });
      refetchProjects();
      // Refetch votes for all projects
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length > 0) {
        fetchProjectVotes(projectIds);
      }
    }
  }, [isSuccess, transactionHash, refetchProjects, refetchCredits, projects]);

  const loadProjects = async (projectsData: any[]) => {
    console.log("Loading projects, total count:", projectsData.length);
    const loadedProjects: Project[] = [];
    const projectIds: number[] = [];

    for (const projectData of projectsData) {
      try {
        console.log(
          `Loading project ${projectData.id} with metadata URI: ${projectData.metadataURI}`
        );

        if (!projectData.metadataURI || projectData.metadataURI.trim() === "") {
          console.log(`Skipping project ${projectData.id}: no metadata URI`);
          continue;
        }

        const metadata = await fetchFromIPFS<ProjectMetadata>(projectData.metadataURI);
        console.log(`Project ${projectData.id} metadata:`, metadata);

        if (!metadata || !metadata.title) {
          console.log(`Skipping project ${projectData.id}: invalid metadata`);
          continue;
        }

        const projectId = Number(projectData.id);
        projectIds.push(projectId);

        loadedProjects.push({
          ...metadata,
          id: projectId,
          status: Number(projectData.status),
          submitter: projectData.owner,
          currentFunding: projectData.receivedFunding.toString(),
          votingPower: "0", // Will be updated from Voting contract
          contributorsCount: 0,
        });
      } catch (error) {
        console.error(`Failed to load project ${projectData.id}:`, error);
      }
    }

    console.log("Loaded projects:", loadedProjects);
    setProjects(loadedProjects);
    setFilteredProjects(loadedProjects);

    // Fetch vote counts from Voting contract
    if (projectIds.length > 0) {
      await fetchProjectVotes(projectIds);
    }
  };

  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => ProjectStatus[p.status] === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, categoryFilter, statusFilter, projects]);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Pending:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case ProjectStatus.Active:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case ProjectStatus.Funded:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case ProjectStatus.Completed:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case ProjectStatus.Cancelled:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

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

  const handleSubmitVote = async (projectId: number) => {
    if (!identity || !merkleProof || !merkleRoot) {
      alert("Please register as a voter first at /register");
      return;
    }

    const votes = allocations.get(projectId);
    if (!votes) return;

    await submitVote({ projectId, votes }, identity, merkleProof);
  };

  const getAllocations = () => {
    return Array.from(allocations.entries()).map(([projectId, votes]) => ({
      projectId,
      votes,
    }));
  };

  const totalCost = calculateTotalCost(getAllocations());

  // Get actual available credits from contract, or use pending calculation
  let availableCredits = VOICE_CREDITS;
  let usedCredits = 0;
  if (voterCreditsData && Array.isArray(voterCreditsData) && voterCreditsData.length >= 3 && Number(voterCreditsData[0]) > 0) {
    availableCredits = Number(voterCreditsData[2]); // availableCredits is the 3rd element
    usedCredits = Number(voterCreditsData[1]); // usedCredits is the 2nd element
  }
  const remainingCredits = availableCredits - totalCost;

  return (
    <ProtectedRoute>
      <div className="min-h-screen max-w-7xl mx-auto bg-background">
        <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.svg"
                alt="ZeroTrace Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">ZeroTrace</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard" className="hidden sm:inline-flex">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <ConnectButton />
              <ModeToggle />
            </div>
          </div>
        </nav>

        <main className="container py-6 sm:py-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 mb-4 sm:mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Public Goods Projects</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Discover and support projects building the future of Web3
              </p>
            </div>
            <Link href="/dashboard/submit-project">
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Submit Project
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="border-2 mb-6 sm:mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Categories</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="tools">Developer Tools</option>
                  <option value="education">Education</option>
                  <option value="community">Community</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Funded">Funded</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Project Count */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>

            {filteredProjects.length > 0 && identity && (
              <Card className="px-4 sm:px-6 py-3 w-full sm:w-auto">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-lg font-bold">
                      {availableCredits} / {VOICE_CREDITS}
                    </p>
                    <p className="text-xs text-muted-foreground">Voice Credits</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{usedCredits + totalCost}</p>
                    <p className="text-xs text-muted-foreground">Used</p>
                  </div>
                </div>
              </Card>
            )}
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
              <CardContent>
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

          {/* Projects Grid */}
          {isLoading ? (
            <Card className="border-2">
              <CardContent className="flex items-center justify-center py-12">
                <Shield className="h-8 w-8 text-primary animate-pulse mr-3" />
                <p className="text-muted-foreground">Loading projects...</p>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card className="border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to submit a project proposal.
                </p>
                <Link href="/dashboard/submit-project">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Submit Your Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="border-2 pt-0 pb-0 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col"
                >
                  <div className="h-full w-full overflow-hidden bg-linear-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                    {project.imageUrl && !imageErrors.has(String(project.id)) ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full "
                        onError={() => {
                          console.log(
                            `Failed to load image for project ${project.id}:`,
                            project.imageUrl
                          );
                          setImageErrors((prev) => new Set(prev).add(String(project.id)));
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                        <svg
                          className="h-16 w-16 text-primary/40 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-muted-foreground">
                          {project.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {ProjectStatus[project.status]}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {project.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* Funding Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Funding Progress</span>
                          <span className="font-semibold">
                            {project.currentFunding} / {project.requestedFunding} ETH
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${
                                (parseFloat(project.currentFunding || "0") /
                                  parseFloat(project.requestedFunding)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Contributors</p>
                          <p className="font-semibold">{project.contributorsCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Voting Power</p>
                          <p className="font-semibold">{projectVotes.get(project.id) || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Milestones</p>
                          <p className="font-semibold">{project.milestones?.length || 0}</p>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{project.category}</Badge>
                        <Link href={`/project/${project.id}`}>
                          <Button variant="secondary" size="sm">
                            View Details →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>

                  {/* Voting Controls */}
                  {identity && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t pt-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold">Allocate Your Votes</p>
                        {(allocations.get(project.id) ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Cost: {(allocations.get(project.id) ?? 0) ** 2} credits
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVotes(project.id, -1)}
                          disabled={!allocations.get(project.id)}
                        >
                          -
                        </Button>
                        <span className="min-w-8 sm:min-w-10 text-center font-semibold">
                          {allocations.get(project.id) || 0}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVotes(project.id, 1)}
                          disabled={remainingCredits < (allocations.get(project.id) || 0) * 2 + 1}
                        >
                          +
                        </Button>
                        <Button
                          size="sm"
                          className="ml-auto"
                          onClick={() => handleSubmitVote(project.id)}
                          disabled={
                            !allocations.get(project.id) || isGeneratingProof || isSubmitting
                          }
                        >
                          {isGeneratingProof || isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isGeneratingProof ? "Proving..." : "Submitting..."}
                            </>
                          ) : (
                            "Submit Vote"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!identity && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t pt-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground text-center">
                        <Link href="/register" className="text-primary hover:underline">
                          Register as a voter
                        </Link>{" "}
                        to participate in voting
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* ZK Proof Status Modal for Demo */}
        {(isGeneratingProof || isSubmitting || isConfirming) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Zero-Knowledge Proof Generation
                </CardTitle>
                <CardDescription>Generating anonymous proof of your vote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Generating Proof */}
                <div className="flex items-start gap-3">
                  {isGeneratingProof ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">Generating ZK Proof</p>
                    <p className="text-sm text-muted-foreground">
                      Creating cryptographic proof without revealing your identity
                    </p>
                  </div>
                </div>

                {/* Step 2: Submitting to Chain */}
                <div className="flex items-start gap-3">
                  {!isGeneratingProof && isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
                  ) : !isGeneratingProof ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">Submitting to Blockchain</p>
                    <p className="text-sm text-muted-foreground">
                      Sending proof to smart contract for verification
                    </p>
                  </div>
                </div>

                {/* Step 3: Verifying Proof */}
                <div className="flex items-start gap-3">
                  {!isGeneratingProof && !isSubmitting && isConfirming ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
                  ) : isSuccess ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">Verifying Proof On-Chain</p>
                    <p className="text-sm text-muted-foreground">
                      Smart contract verifying your anonymous vote
                    </p>
                  </div>
                </div>

                {/* Privacy Info */}
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Privacy Guaranteed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your vote is anonymous. Only the proof is verified, not your identity.
                  </p>
                </div>

                {transactionHash && (
                  <div className="text-center">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View on Etherscan →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
