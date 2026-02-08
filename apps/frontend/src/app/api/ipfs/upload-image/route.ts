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
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: pinataFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata image upload failed:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to upload image to IPFS" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ IpfsHash: result.IpfsHash });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image to IPFS" },
      { status: 500 }
    );
  }
}
