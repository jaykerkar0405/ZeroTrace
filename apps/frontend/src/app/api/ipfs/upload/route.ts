import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: NextRequest) {
  if (!PINATA_JWT) {
    console.error("PINATA_JWT environment variable is not set");
    return NextResponse.json(
      { error: "IPFS service not configured — PINATA_JWT env var is missing" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: body.data,
          pinataMetadata: {
            name: `zerotrace-project-${Date.now()}`,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata upload failed:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to upload to IPFS" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ IpfsHash: result.IpfsHash });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload to IPFS" },
      { status: 500 }
    );
  }
}
