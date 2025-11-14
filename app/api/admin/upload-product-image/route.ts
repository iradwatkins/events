import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";

// Get storage path at RUNTIME, not compile time
function getStoragePath() {
  // First check if explicitly set
  if (process.env.PRODUCT_IMAGE_STORAGE_PATH) {
    return process.env.PRODUCT_IMAGE_STORAGE_PATH;
  }

  // Then check NODE_ENV at runtime
  if (process.env.NODE_ENV === "production") {
    return "/root/websites/events-stepperslife/STEPFILES/product-images";
  }

  // Default to local development path
  return path.join(process.cwd(), "STEPFILES", "product-images");
}

// Calculate file hash for duplicate detection
async function calculateFileHash(buffer: Buffer): Promise<string> {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const storagePath = getStoragePath();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate file hash for unique naming
    const fileHash = await calculateFileHash(buffer);
    const timestamp = Date.now();

    // Ensure storage directory exists
    if (!existsSync(storagePath)) {
      await mkdir(storagePath, { recursive: true });
    }

    // Optimize image with sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, null, {
        // Resize width to 1200px, maintain aspect ratio
        withoutEnlargement: true,
        fit: "inside",
      })
      .jpeg({
        quality: 85, // Good quality while reducing file size
        progressive: true,
      })
      .toBuffer();

    // Save optimized image with hash and timestamp
    const filename = `${fileHash}-${timestamp}.jpg`;
    const filepath = path.join(storagePath, filename);
    await writeFile(filepath, optimizedBuffer);

    // Calculate sizes for reporting
    const originalSize = buffer.length;
    const optimizedSize = optimizedBuffer.length;
    const savedBytes = originalSize - optimizedSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);


    // Return relative URL (served via Next.js API route)
    const publicUrl = `/api/product-images/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      hash: fileHash,
      url: publicUrl,
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercent: `${savedPercent}%`,
    });
  } catch (error) {
    console.error("Product image upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload product image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
