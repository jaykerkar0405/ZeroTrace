export const PINATA_GATEWAY =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export async function uploadToIPFS(data: object): Promise<string> {
    try {
        const response = await fetch("/api/ipfs/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("IPFS upload failed:", response.status, errorData);
            throw new Error(errorData.error || `Failed to upload to IPFS (${response.status})`);
        }

        const result = await response.json();
        return result.IpfsHash;
    } catch (error) {
        console.error("IPFS upload error:", error);
        throw error;
    }
}

export async function fetchFromIPFS<T>(cid: string): Promise<T> {
    try {
        const gateway = PINATA_GATEWAY.endsWith("/") ? PINATA_GATEWAY : `${PINATA_GATEWAY}/`;
        const url = `${gateway}${cid}`;
        console.log("Fetching from IPFS:", url);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`IPFS fetch failed with status ${response.status}:`, response.statusText);
            throw new Error(`Failed to fetch from IPFS: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Successfully fetched IPFS data:", data);
        return data;
    } catch (error) {
        console.error("IPFS fetch error for CID:", cid, error);
        throw error;
    }
}

export async function uploadImageToIPFS(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ipfs/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Image upload failed:", response.status, errorData);
            throw new Error(errorData.error || `Failed to upload image (${response.status})`);
        }

        const result = await response.json();
        const gateway = PINATA_GATEWAY.endsWith("/") ? PINATA_GATEWAY : `${PINATA_GATEWAY}/`;
        const imageUrl = `${gateway}${result.IpfsHash}`;
        console.log("Image uploaded to IPFS:", imageUrl);
        return imageUrl;
    } catch (error) {
        console.error("Image upload error:", error);
        throw error;
    }
}
