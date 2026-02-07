"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { poseidon1, poseidon2 } from "poseidon-lite";

export default function SyncVoterData() {
    const [syncing, setSyncing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasNullifier, setHasNullifier] = useState(false);

    useEffect(() => {
        // Check if user has nullifier
        const nullifier = localStorage.getItem('user_nullifier');
        setHasNullifier(!!nullifier);
    }, []);

    const syncVoterData = () => {
        setSyncing(true);
        setError(null);
        setSuccess(false);

        try {
            const userNullifier = localStorage.getItem('user_nullifier');
            
            if (!userNullifier) {
                throw new Error('No nullifier found. Please register first at /register');
            }

            console.log('Found nullifier:', userNullifier);

            // Convert to BigInt
            const nullifier = BigInt(userNullifier);
            
            // Generate secret (deterministic derivation)
            const secret = nullifier * 2n;
            
            console.log('Generated secret');

            // Create identity commitment (must match circuit: Poseidon(secret))
            console.log('Generating commitment...');
            const commitment = poseidon1([secret]);
            
            console.log('Generated commitment:', commitment.toString());

            // Quick demo solution: Generate proof without full tree
            console.log('Building simple proof for demo...');
            
            const TREE_LEVELS = 20;
            
            // Calculate zero values for each level
            console.log('Calculating zero values...');
            const zeroValues: bigint[] = [0n];
            let currentZero = 0n;
            for (let i = 1; i < TREE_LEVELS; i++) {
                currentZero = poseidon2([currentZero, currentZero]);
                zeroValues.push(currentZero);
            }
            console.log('Zero values calculated');
            
            // Calculate root: hash from leaf (commitment) up to root
            console.log('Calculating merkle root...');
            let currentHash = commitment;
            const siblings: bigint[] = [];
            const pathIndices: number[] = [];
            
            for (let i = 0; i < TREE_LEVELS; i++) {
                siblings.push(zeroValues[i]);
                pathIndices.push(0);
                currentHash = poseidon2([currentHash, zeroValues[i]]);
            }
            
            const merkleRoot = currentHash;
            console.log('Merkle root:', merkleRoot.toString());

            const proof = { pathIndices, siblings };
            
            console.log('Generated proof successfully');
            console.log('Proof pathIndices:', proof.pathIndices);
            console.log('Proof siblings count:', proof.siblings.length);

            // Store voter identity
            const voterIdentity = {
                secret: secret.toString(),
                nullifier: nullifier.toString()
            };
            localStorage.setItem("voterIdentity", JSON.stringify(voterIdentity));
            
            // Store merkle proof
            const merkleProof = {
                pathIndices: proof.pathIndices,
                siblings: proof.siblings.map(s => s.toString())
            };
            localStorage.setItem("merkleProof", JSON.stringify(merkleProof));
            
            // Store merkle root
            localStorage.setItem("merkleRoot", merkleRoot.toString());

            console.log('✅ All data stored in localStorage');
            console.log('voterIdentity:', voterIdentity);
            console.log('merkleRoot:', merkleRoot.toString());

            setSuccess(true);
            setSyncing(false);
            
            // Reload page after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard/projects';
            }, 2000);

        } catch (err: any) {
            console.error('❌ Sync error:', err);
            console.error('Error stack:', err.stack);
            setError(err.message || 'Failed to sync voter data');
            setSyncing(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto py-20">
            <Card>
                <CardHeader>
                    <CardTitle>Sync Voter Data</CardTitle>
                    <CardDescription>
                        Generate your voter credentials to participate in voting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {hasNullifier ? (
                        <div className="text-sm text-green-600 mb-4">
                            ✓ Voter registration detected
                        </div>
                    ) : (
                        <div className="text-sm text-orange-600 mb-4">
                            ⚠ No registration found. Please register first.
                        </div>
                    )}

                    <Button
                        onClick={syncVoterData}
                        disabled={syncing || !hasNullifier}
                        className="w-full"
                    >
                        {syncing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating credentials...
                            </>
                        ) : (
                            'Generate Voter Credentials'
                        )}
                    </Button>

                    {success && (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <p className="text-sm">
                                Success! Redirecting to projects page...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!hasNullifier && (
                        <div className="text-center pt-4">
                            <a href="/register" className="text-sm text-primary hover:underline">
                                Go to Registration →
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
