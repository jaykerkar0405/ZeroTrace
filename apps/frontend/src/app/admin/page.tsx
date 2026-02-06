"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { Shield, House, CircleCheck, CircleX, Clock, TrendingUp, Users, Coins, FolderKanban, TriangleAlert } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProtectedRoute } from "@/components/protected-route";
import { fetchFromIPFS } from "@/lib/storage/ipfs";
import { ProjectMetadata, ProjectStatus } from "@/types";
import { PROJECT_ABI, PROJECT_ADDRESS, VOTER_REGISTRY_ABI, VOTER_REGISTRY_ADDRESS } from "@/contracts";

// Admin wallet address - should match contract owner
const ADMIN_ADDRESS = "0xd2e06BcB4e0E2cC978de6eb606B685B1F6EFC4d6";

export default function AdminPage() {
    const { address } = useAccount();
    const [pendingProjects, setPendingProjects] = useState<any[]>([]);
    const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

    // Check if user is admin
    const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

    // Read all projects
    const { data: allProjectsData, refetch: refetchProjects } = useReadContract({
        address: PROJECT_ADDRESS,
        abi: PROJECT_ABI,
        functionName: "getAllProjects",
    });

    // Read total voters
    const { data: totalVoters } = useReadContract({
        address: VOTER_REGISTRY_ADDRESS,
        abi: VOTER_REGISTRY_ABI,
        functionName: "getTotalRegisteredVoters",
    });

    // Write contract for approval
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (allProjectsData && Array.isArray(allProjectsData)) {
            loadProjects(allProjectsData as any[]);
        }
    }, [allProjectsData]);

    useEffect(() => {
        if (isSuccess) {
            refetchProjects();
            setSelectedProject(null);
            setActionType(null);
        }
    }, [isSuccess, refetchProjects]);

    const loadProjects = async (projectsData: any[]) => {
        const pending: any[] = [];
        const approved: any[] = [];

        for (const projectData of projectsData) {
            try {
                const metadata = await fetchFromIPFS<ProjectMetadata>(projectData.metadataURI);
                const project = {
                    ...projectData,
                    metadata,
                    id: Number(projectData.id),
                    status: Number(projectData.status),
                };

                if (project.status === ProjectStatus.Pending) {
                    pending.push(project);
                } else if (project.status === ProjectStatus.Active || project.status === ProjectStatus.Funded) {
                    approved.push(project);
                }
            } catch (error) {
                console.error(`Failed to load project ${projectData.id}:`, error);
            }
        }

        setPendingProjects(pending);
        setApprovedProjects(approved);
    };

    const handleApprove = (projectId: number) => {
        setSelectedProject(projectId);
        setActionType("approve");
        writeContract({
            address: PROJECT_ADDRESS,
            abi: PROJECT_ABI,
            functionName: "approveProject",
            args: [BigInt(projectId)],
        });
    };

    const calculateStats = () => {
        const totalProjects = pendingProjects.length + approvedProjects.length;
        const totalFundingRequested = [...pendingProjects, ...approvedProjects].reduce(
            (sum, p) => sum + Number(formatEther(p.requestedFunding)),
            0
        );
        const totalFundingReceived = [...pendingProjects, ...approvedProjects].reduce(
            (sum, p) => sum + Number(formatEther(p.receivedFunding)),
            0
        );

        return {
            totalProjects,
            pendingCount: pendingProjects.length,
            approvedCount: approvedProjects.length,
            totalFundingRequested: totalFundingRequested.toFixed(2),
            totalFundingReceived: totalFundingReceived.toFixed(2),
            totalVoters: totalVoters ? Number(totalVoters) : 0,
        };
    };

    const stats = calculateStats();

    if (!isAdmin) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen max-w-7xl mx-auto bg-background">
                    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
                        <div className="container flex h-16 items-center justify-between">
                            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <Image src="/logo.svg" alt="ZeroTrace Logo" width={32} height={32} className="h-8 w-8" />
                                <span className="text-xl font-bold">ZeroTrace</span>
                            </Link>
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard">
                                    <Button variant="ghost" className="gap-2">
                                        <House className="h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <ConnectButton />
                                <ModeToggle />
                            </div>
                        </div>
                    </nav>

                    <main className="container py-20">
                        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
                            <Card className="max-w-md text-center">
                                <CardHeader>
                                    <TriangleAlert className="mx-auto h-16 w-16 text-destructive" />
                                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                                    <CardDescription>
                                        You must be an administrator to access this page.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Current wallet: <span className="font-mono">{address}</span>
                                    </p>
                                    <Link href="/dashboard">
                                        <Button>Return to Dashboard</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen max-w-7xl mx-auto bg-background">
                <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
                    <div className="container flex h-16 items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Image src="/logo.svg" alt="ZeroTrace Logo" width={32} height={32} className="h-8 w-8" />
                            <span className="text-xl font-bold">ZeroTrace</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" className="gap-2">
                                    <House className="h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/dashboard/projects">
                                <Button variant="ghost" className="gap-2">
                                    <FolderKanban className="h-4 w-4" />
                                    Projects
                                </Button>
                            </Link>
                            <ConnectButton />
                            <ModeToggle />
                        </div>
                    </div>
                </nav>

                <main className="container py-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
                        <p className="text-muted-foreground">Manage projects, users, and platform settings</p>
                    </div>

                    {/* Analytics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.pendingCount} pending, {stats.approvedCount} approved
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Registered Voters</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalVoters}</div>
                                <p className="text-xs text-muted-foreground">Verified unique humans</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
                                <Coins className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalFundingReceived} ETH</div>
                                <p className="text-xs text-muted-foreground">
                                    of {stats.totalFundingRequested} ETH requested
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Projects Queue */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        <Clock className="h-6 w-6 text-yellow-500" />
                                        Pending Approvals
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Review and approve project submissions from other users
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-lg px-3 py-1">
                                    {pendingProjects.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {pendingProjects.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CircleCheck className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                    No pending projects to review
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingProjects.map((project) => {
                                        const isOwnProject = project.owner.toLowerCase() === address?.toLowerCase();
                                        return (
                                            <Card key={project.id} className="border-2">
                                                <CardContent className="pt-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold mb-2">
                                                                {project.metadata.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                                {project.metadata.description}
                                                            </p>
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                <Badge variant="outline">{project.metadata.category}</Badge>
                                                                <Badge variant="outline">
                                                                    {formatEther(project.requestedFunding)} ETH requested
                                                                </Badge>
                                                                <Badge variant="outline">
                                                                    {project.metadata.milestones?.length || 0} milestones
                                                                </Badge>
                                                                {isOwnProject && (
                                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                                        Your Project
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Submitted by:{" "}
                                                                <span className="font-mono">{project.owner.slice(0, 10)}...</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            {isOwnProject ? (
                                                                <div className="text-right">
                                                                    <Button
                                                                        size="sm"
                                                                        disabled
                                                                        variant="outline"
                                                                        className="gap-2 cursor-not-allowed opacity-50"
                                                                    >
                                                                        <TriangleAlert className="h-4 w-4" />
                                                                        Cannot Approve Own Project
                                                                    </Button>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Conflict of interest
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove(project.id)}
                                                                    disabled={
                                                                        isPending ||
                                                                        isConfirming ||
                                                                        (selectedProject === project.id && actionType === "approve")
                                                                    }
                                                                    className="gap-2"
                                                                >
                                                                    {selectedProject === project.id && actionType === "approve" ? (
                                                                        <>
                                                                            {isPending && "Confirming..."}
                                                                            {isConfirming && "Approving..."}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CircleCheck className="h-4 w-4" />
                                                                            Approve
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Projects */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        <TrendingUp className="h-6 w-6 text-green-500" />
                                        Active Projects
                                    </CardTitle>
                                    <CardDescription className="mt-1">Currently live projects</CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-lg px-3 py-1">
                                    {approvedProjects.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {approvedProjects.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FolderKanban className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                    No active projects yet
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {approvedProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{project.metadata.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatEther(project.receivedFunding)} /{" "}
                                                    {formatEther(project.requestedFunding)} ETH raised
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className={
                                                        project.status === ProjectStatus.Funded
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                    }
                                                >
                                                    {ProjectStatus[project.status]}
                                                </Badge>
                                                <Link href={`/project/${project.id}`}>
                                                    <Button size="sm" variant="ghost">
                                                        View →
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </ProtectedRoute>
    );
}
