"use client";

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { Shield, Home, Search, Plus, ArrowLeft, FolderKanban } from "lucide-react";
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

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    // Read all projects from contract
    const { data: allProjectsData, isLoading } = useReadContract({
        address: PROJECT_ADDRESS,
        abi: PROJECT_ABI,
        functionName: "getAllProjects",
    });

    useEffect(() => {
        if (allProjectsData && Array.isArray(allProjectsData)) {
            loadProjects(allProjectsData as any[]);
        }
    }, [allProjectsData]);

    const loadProjects = async (projectsData: any[]) => {
        console.log("Loading projects, total count:", projectsData.length);
        const loadedProjects: Project[] = [];

        for (const projectData of projectsData) {
            try {
                console.log(`Loading project ${projectData.id} with metadata URI: ${projectData.metadataURI}`);
                // Fetch metadata from IPFS
                const metadata = await fetchFromIPFS<ProjectMetadata>(projectData.metadataURI);
                console.log(`Project ${projectData.id} metadata:`, metadata);
                console.log(`Project ${projectData.id} imageUrl:`, metadata.imageUrl);

                loadedProjects.push({
                    ...metadata,
                    id: projectData.id,
                    status: Number(projectData.status),
                    submitter: projectData.owner,
                    currentFunding: projectData.receivedFunding.toString(),
                    votingPower: projectData.totalVotes.toString(),
                    contributorsCount: 0, // Not tracked yet
                });
            } catch (error) {
                console.error(`Failed to load project ${projectData.id}:`, error);
            }
        }

        console.log("Loaded projects:", loadedProjects);
        setProjects(loadedProjects);
        setFilteredProjects(loadedProjects);
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

                <main className="container py-8">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="gap-2 mb-6">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Public Goods Projects</h1>
                            <p className="text-muted-foreground">
                                Discover and support projects building the future of Web3
                            </p>
                        </div>
                        <Link href="/dashboard/submit-project">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Submit Project
                            </Button>
                        </Link>
                    </div>

                    {/* Filters */}
                    <Card className="border-2 mb-8">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2 relative">
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
                    <div className="mb-6">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredProjects.length} of {projects.length} projects
                        </p>
                    </div>

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
                                <p className="text-muted-foreground mb-4">Be the first to submit a project proposal.</p>
                                <Link href="/dashboard/submit-project">
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Submit Your Project
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {filteredProjects.map((project) => (
                                <Card
                                    key={project.id}
                                    className="border-2 pt-0 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col"
                                >
                                    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                                        {project.imageUrl && !imageErrors.has(String(project.id)) ? (
                                            <img
                                                src={project.imageUrl}
                                                alt={project.title}
                                                className="w-full h-full "
                                                onError={() => {
                                                    console.log(`Failed to load image for project ${project.id}:`, project.imageUrl);
                                                    setImageErrors(prev => new Set(prev).add(String(project.id)));
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                                                <svg className="h-16 w-16 text-primary/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm font-medium text-muted-foreground">{project.title}</span>
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
                                                            width: `${(parseFloat(project.currentFunding || "0") /
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
                                                    <p className="font-semibold">{project.votingPower || 0}</p>
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
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
