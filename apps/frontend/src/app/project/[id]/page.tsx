"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { Shield, Home, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProtectedRoute } from "@/components/protected-route";
import { fetchFromIPFS } from "@/lib/storage/ipfs";
import { Project, ProjectMetadata, ProjectStatus } from "@/types";
import { PROJECT_ABI, PROJECT_ADDRESS } from "@/contracts";

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const { data: projectData } = useReadContract({
        address: PROJECT_ADDRESS,
        abi: PROJECT_ABI,
        functionName: "getProject",
        args: [BigInt(projectId)],
    });

    useEffect(() => {
        if (projectData) {
            loadProject(projectData as any);
        }
    }, [projectData]);

    const loadProject = async (data: any) => {
        try {
            const metadata = await fetchFromIPFS<ProjectMetadata>(data.metadataURI);
            setProject({
                ...metadata,
                id: data.id,
                status: Number(data.status),
                submitter: data.owner,
                currentFunding: formatEther(data.receivedFunding),
                votingPower: data.totalVotes.toString(),
                contributorsCount: 0,
            });
        } catch (error) {
            console.error("Failed to load project:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const fundingPercent = project
        ? Math.min(
              (parseFloat(project.currentFunding || "0") / parseFloat(project.requestedFunding || "1")) * 100,
              100
          )
        : 0;

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
                            <Link href="/dashboard">
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

                <main className="container py-20 max-w-4xl mx-auto">
                    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-8">
                        <Link
                            href="/dashboard/projects"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to projects
                        </Link>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <Shield className="mx-auto h-12 w-12 text-primary animate-pulse" />
                                    <p className="mt-4 text-muted-foreground">Loading project...</p>
                                </div>
                            </div>
                        ) : !project ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-lg font-medium">Project not found</p>
                                    <p className="text-muted-foreground mt-1">
                                        This project may not exist or has been removed.
                                    </p>
                                    <Link href="/dashboard/projects">
                                        <Button className="mt-4">Browse projects</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Cover image */}
                                {project.imageUrl && !imageError && (
                                    <div className="w-full rounded-xl overflow-hidden border bg-muted">
                                        <img
                                            src={project.imageUrl}
                                            alt={project.title}
                                            className="w-full max-h-80 object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    </div>
                                )}

                                {/* Header */}
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 flex-wrap">
                                        <Badge className={getStatusColor(project.status)}>
                                            {ProjectStatus[project.status]}
                                        </Badge>
                                        <Badge variant="outline">{project.category}</Badge>
                                    </div>
                                    <h1 className="text-4xl font-bold">{project.title}</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Submitted by{" "}
                                        <span className="font-mono">
                                            {project.submitter.slice(0, 6)}...{project.submitter.slice(-4)}
                                        </span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left column — main content */}
                                    <div className="md:col-span-2 space-y-8">
                                        {/* Description */}
                                        <section>
                                            <h2 className="text-lg font-semibold mb-3">About</h2>
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {project.description}
                                            </p>
                                        </section>

                                        {/* Milestones */}
                                        {project.milestones && project.milestones.length > 0 && (
                                            <section>
                                                <h2 className="text-lg font-semibold mb-3">Milestones</h2>
                                                <div className="space-y-3">
                                                    {project.milestones.map((milestone, i) => (
                                                        <div
                                                            key={i}
                                                            className="rounded-lg border p-4 space-y-2"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="font-medium">{milestone.title}</h3>
                                                                {milestone.deadline && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Due{" "}
                                                                        {new Date(milestone.deadline).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {milestone.description}
                                                            </p>
                                                            {milestone.deliverables && milestone.deliverables.length > 0 &&
                                                                milestone.deliverables.some((d) => d !== milestone.description) && (
                                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                                    {milestone.deliverables
                                                                        .filter((d) => d !== milestone.description)
                                                                        .map((d, j) => (
                                                                            <Badge key={j} variant="outline" className="text-xs max-w-full truncate">
                                                                                {d}
                                                                            </Badge>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Team */}
                                        {project.teamInfo && project.teamInfo.length > 0 && (
                                            <section>
                                                <h2 className="text-lg font-semibold mb-3">Team</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {project.teamInfo.map((member, i) => (
                                                        <div
                                                            key={i}
                                                            className="rounded-lg border p-4 space-y-1"
                                                        >
                                                            <p className="font-medium">{member.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {member.role}
                                                            </p>
                                                            {member.bio && (
                                                                <p className="text-xs text-muted-foreground pt-1">
                                                                    {member.bio}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-3 pt-1">
                                                                {member.github && (
                                                                    <a
                                                                        href={`https://github.com/${member.github}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        GitHub
                                                                    </a>
                                                                )}
                                                                {member.twitter && (
                                                                    <a
                                                                        href={`https://twitter.com/${member.twitter}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        Twitter
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Links */}
                                        {project.links && Object.values(project.links).some(Boolean) && (
                                            <section>
                                                <h2 className="text-lg font-semibold mb-3">Links</h2>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.links.website && (
                                                        <a href={project.links.website} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                                Website
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    {project.links.github && (
                                                        <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                                GitHub
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    {project.links.twitter && (
                                                        <a href={project.links.twitter} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                                Twitter
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    {project.links.discord && (
                                                        <a href={project.links.discord} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                                Discord
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    {/* Right column — stats sidebar */}
                                    <div className="space-y-4">
                                        {/* Funding */}
                                        <Card className="border-2">
                                            <CardContent className="pt-6 space-y-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Funding raised</p>
                                                    <p className="text-2xl font-bold">
                                                        {project.currentFunding}{" "}
                                                        <span className="text-base font-normal text-muted-foreground">
                                                            / {project.requestedFunding} ETH
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{ width: `${fundingPercent}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground text-right">
                                                    {fundingPercent.toFixed(1)}% funded
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg border p-4 text-center">
                                                <p className="text-2xl font-bold">
                                                    {project.votingPower || "0"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Votes</p>
                                            </div>
                                            <div className="rounded-lg border p-4 text-center">
                                                <p className="text-2xl font-bold">
                                                    {project.contributorsCount || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Contributors
                                                </p>
                                            </div>
                                            <div className="rounded-lg border p-4 text-center col-span-2">
                                                <p className="text-2xl font-bold">
                                                    {project.milestones?.length || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Milestones
                                                </p>
                                            </div>
                                        </div>

                                        {/* Submitter */}
                                        <div className="rounded-lg border p-4 space-y-1">
                                            <p className="text-xs text-muted-foreground">Submitter</p>
                                            <p className="text-sm font-mono break-all">
                                                {project.submitter}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
