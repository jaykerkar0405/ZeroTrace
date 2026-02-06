"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Home, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ProtectedRoute } from "@/components/protected-route";
import { uploadToIPFS, uploadImageToIPFS } from "@/lib/storage/ipfs";
import { ProjectMetadata } from "@/types";
import { PROJECT_ABI, PROJECT_ADDRESS } from "@/contracts";

const inputStyles =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SubmitProjectPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [requestedFunding, setRequestedFunding] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const [milestoneTitle, setMilestoneTitle] = useState("");
    const [milestoneDescription, setMilestoneDescription] = useState("");
    const [milestoneDeadline, setMilestoneDeadline] = useState("");

    const [teamName, setTeamName] = useState("");
    const [teamRole, setTeamRole] = useState("");

    const [isUploading, setIsUploading] = useState(false);

    const { writeContract, data: hash, error, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let imageUrl = "";
            if (imageFile) {
                imageUrl = await uploadImageToIPFS(imageFile);
            }

            const metadata: ProjectMetadata = {
                title,
                description,
                milestones: milestoneTitle
                    ? [
                        {
                            title: milestoneTitle,
                            description: milestoneDescription,
                            fundingAmount: requestedFunding,
                            deadline: milestoneDeadline,
                            deliverables: [milestoneDescription],
                        },
                    ]
                    : [],
                teamInfo: teamName
                    ? [
                        {
                            name: teamName,
                            role: teamRole,
                        },
                    ]
                    : [],
                requestedFunding,
                category,
                imageUrl,
            };

            const cid = await uploadToIPFS(metadata);

            writeContract({
                address: PROJECT_ADDRESS,
                abi: PROJECT_ABI,
                functionName: "submitProject",
                args: [cid, parseEther(requestedFunding)],
            });
        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to submit project. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    if (isSuccess) {
        setTimeout(() => router.push("/dashboard/projects"), 2000);
    }

    const isSubmitting = isUploading || isPending || isConfirming;

    return (
        <ProtectedRoute>
            <div className="min-h-screen max-w-7xl mx-auto bg-background">
                <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="container flex h-16 items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Image src="/logo.svg" alt="ZeroTrace Logo" width={32} height={32} className="h-8 w-8" />
                            <span className="text-xl font-bold">ZeroTrace</span>
                        </Link>
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

                <main className="container py-20 max-w-3xl">
                    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-8">
                        {/* Header */}
                        <div>
                            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to dashboard
                            </Link>
                            <h1 className="text-4xl font-bold">New project</h1>
                            <p className="text-muted-foreground mt-2">
                                Describe your project and submit it for quadratic funding.
                            </p>
                        </div>

                        {/* Status messages */}
                        {isSuccess && (
                            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <div>
                                    <p className="font-medium text-green-500">Project submitted!</p>
                                    <p className="text-sm text-muted-foreground">Redirecting you to projects...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                <div>
                                    <p className="font-medium text-destructive">Something went wrong</p>
                                    <p className="text-sm text-muted-foreground">{error.message}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Project details */}
                            <section className="space-y-5">
                                <div>
                                    <h2 className="text-lg font-semibold">Project details</h2>
                                    <p className="text-sm text-muted-foreground">
                                        What are you building and how much do you need?
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="title" className="text-sm font-medium">
                                            Title
                                        </label>
                                        <input
                                            id="title"
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className={inputStyles}
                                            placeholder="e.g. Decentralized Identity Toolkit"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-sm font-medium">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            required
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className={`${inputStyles} min-h-[120px] h-auto`}
                                            placeholder="What does your project do? Who benefits from it?"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="category" className="text-sm font-medium">
                                                Category
                                            </label>
                                            <select
                                                id="category"
                                                required
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className={inputStyles}
                                            >
                                                <option value="">Pick one</option>
                                                <option value="infrastructure">Infrastructure</option>
                                                <option value="tools">Developer Tools</option>
                                                <option value="education">Education</option>
                                                <option value="community">Community</option>
                                                <option value="research">Research</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="funding" className="text-sm font-medium">
                                                Funding needed (ETH)
                                            </label>
                                            <input
                                                id="funding"
                                                type="number"
                                                step="0.01"
                                                required
                                                value={requestedFunding}
                                                onChange={(e) => setRequestedFunding(e.target.value)}
                                                className={inputStyles}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="image" className="text-sm font-medium">
                                            Cover image
                                            <span className="ml-1.5 text-muted-foreground font-normal">
                                                (optional)
                                            </span>
                                        </label>
                                        <input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={`${inputStyles} file:border-0 file:bg-transparent file:text-sm file:font-medium`}
                                        />
                                        {imagePreview && (
                                            <div className="mt-3 rounded-lg border overflow-hidden">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-h-48 object-contain mx-auto"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="border-t" />

                            {/* Milestone */}
                            <section className="space-y-5">
                                <div>
                                    <h2 className="text-lg font-semibold">First milestone</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Optional — you can always add milestones later.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="milestone-title" className="text-sm font-medium">
                                            Milestone title
                                        </label>
                                        <input
                                            id="milestone-title"
                                            type="text"
                                            value={milestoneTitle}
                                            onChange={(e) => setMilestoneTitle(e.target.value)}
                                            className={inputStyles}
                                            placeholder="e.g. Beta launch"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="milestone-description" className="text-sm font-medium">
                                                What will you deliver?
                                            </label>
                                            <input
                                                id="milestone-description"
                                                type="text"
                                                value={milestoneDescription}
                                                onChange={(e) => setMilestoneDescription(e.target.value)}
                                                className={inputStyles}
                                                placeholder="Working prototype, docs, etc."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="milestone-deadline" className="text-sm font-medium">
                                                Deadline
                                            </label>
                                            <input
                                                id="milestone-deadline"
                                                type="date"
                                                value={milestoneDeadline}
                                                onChange={(e) => setMilestoneDeadline(e.target.value)}
                                                className={inputStyles}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="border-t" />

                            {/* Team */}
                            <section className="space-y-5">
                                <div>
                                    <h2 className="text-lg font-semibold">Team lead</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Who&apos;s responsible for this project? You can add more people later.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="team-name" className="text-sm font-medium">
                                            Name
                                        </label>
                                        <input
                                            id="team-name"
                                            type="text"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            className={inputStyles}
                                            placeholder="Your name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="team-role" className="text-sm font-medium">
                                            Role
                                        </label>
                                        <input
                                            id="team-role"
                                            type="text"
                                            value={teamRole}
                                            onChange={(e) => setTeamRole(e.target.value)}
                                            className={inputStyles}
                                            placeholder="e.g. Lead developer"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="border-t" />

                            {/* Actions */}
                            <div className="flex items-center justify-between pb-8">
                                <Link href="/dashboard">
                                    <Button type="button" variant="ghost" className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="gap-2 px-6"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    {isUploading
                                        ? "Uploading to IPFS..."
                                        : isPending
                                            ? "Confirm in wallet..."
                                            : isConfirming
                                                ? "Submitting on-chain..."
                                                : "Submit project"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
