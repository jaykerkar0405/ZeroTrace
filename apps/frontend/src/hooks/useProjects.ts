import { useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import ProjectABI from '@/contracts/Project.json';

const PROJECT_CONTRACT_ADDRESS = ProjectABI.address as `0x${string}`;

interface BlockchainProject {
  id: bigint;
  owner: string;
  metadataURI: string;
  requestedFunding: bigint;
  receivedFunding: bigint;
  totalVotes: bigint;
  createdAt: bigint;
  status: number;
}

interface ProjectMetadata {
  title: string;
  description: string;
  category: string;
  milestones?: string[];
  team?: string;
}

export interface Project {
  id: number;
  owner: string;
  title: string;
  description: string;
  category: string;
  requestedFunding: number;
  receivedFunding: number;
  totalVotes: number;
  createdAt: number;
  status: number;
  metadataURI: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: blockchainProjects, isLoading, error: contractError } = useReadContract({
    address: PROJECT_CONTRACT_ADDRESS,
    abi: ProjectABI.abi,
    functionName: 'getActiveProjects',
  });

  useEffect(() => {
    async function fetchMetadata() {
      if (!blockchainProjects || !Array.isArray(blockchainProjects)) {
        setLoading(false);
        return;
      }

      try {
        const projectsWithMetadata = await Promise.all(
          (blockchainProjects as BlockchainProject[]).map(async (project) => {
            // Skip projects with empty metadataURI
            if (!project.metadataURI || project.metadataURI.trim() === '') {
              return null;
            }

            try {
              const ipfsUrl = project.metadataURI.startsWith('ipfs://')
                ? `https://ipfs.io/ipfs/${project.metadataURI.replace('ipfs://', '')}`
                : project.metadataURI;

              const response = await fetch(ipfsUrl);
              if (!response.ok) {
                console.warn(`Failed to fetch metadata for project ${project.id}: ${response.status}`);
                return null;
              }

              const metadata: ProjectMetadata = await response.json();

              // Validate that metadata has required fields
              if (!metadata.title || !metadata.description || !metadata.category) {
                console.warn(`Invalid metadata for project ${project.id}: missing required fields`);
                return null;
              }

              return {
                id: Number(project.id),
                owner: project.owner,
                title: metadata.title,
                description: metadata.description,
                category: metadata.category,
                requestedFunding: Number(project.requestedFunding),
                receivedFunding: Number(project.receivedFunding),
                totalVotes: Number(project.totalVotes),
                createdAt: Number(project.createdAt),
                status: project.status,
                metadataURI: project.metadataURI,
              };
            } catch (err) {
              console.error(`Failed to fetch metadata for project ${project.id}:`, err);
              return null;
            }
          })
        );

        // Filter out null entries (projects with failed IPFS fetches)
        const validProjects = projectsWithMetadata.filter((p): p is Project => p !== null);
        
        setProjects(validProjects);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [blockchainProjects]);

  return {
    projects,
    loading: isLoading || loading,
    error: contractError?.message || error,
  };
}

export function useProject(projectId: number) {
  const { data: project, isLoading, error } = useReadContract({
    address: PROJECT_CONTRACT_ADDRESS,
    abi: ProjectABI.abi,
    functionName: 'getProject',
    args: [BigInt(projectId)],
  });

  const [projectWithMetadata, setProjectWithMetadata] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      if (!project) return;

      const blockchainProject = project as unknown as BlockchainProject;
      
      let metadata: ProjectMetadata = {
        title: 'Untitled Project',
        description: 'No description available',
        category: 'General',
      };

      try {
        const ipfsUrl = blockchainProject.metadataURI.startsWith('ipfs://')
          ? `https://ipfs.io/ipfs/${blockchainProject.metadataURI.replace('ipfs://', '')}`
          : blockchainProject.metadataURI;

        const response = await fetch(ipfsUrl);
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (err) {
        console.error(`Failed to fetch metadata for project ${projectId}:`, err);
      }

      setProjectWithMetadata({
        id: Number(blockchainProject.id),
        owner: blockchainProject.owner,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        requestedFunding: Number(blockchainProject.requestedFunding),
        receivedFunding: Number(blockchainProject.receivedFunding),
        totalVotes: Number(blockchainProject.totalVotes),
        createdAt: Number(blockchainProject.createdAt),
        status: blockchainProject.status,
        metadataURI: blockchainProject.metadataURI,
      });
    }

    fetchMetadata();
  }, [project, projectId]);

  return {
    project: projectWithMetadata,
    loading: isLoading,
    error: error?.message,
  };
}
