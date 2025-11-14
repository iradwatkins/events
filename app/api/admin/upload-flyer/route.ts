import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";

const FLYER_STORAGE_PATH = "/root/websites/events-stepperslife/STEPFILES/event-flyers";

// Calculate file hash for duplicate detection
async function calculateFileHash(buffer: Buffer): Promise<string> {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Check if flyer already exists
function checkDuplicateByHash(hash: string): boolean {
  const hashFilePath = path.join(FLYER_STORAGE_PATH, `${hash}.jpg`);
  return existsSync(hashFilePath);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate file hash for duplicate detection
    const fileHash = await calculateFileHash(buffer);

    // Check for duplicates
    const isDuplicate = checkDuplicateByHash(fileHash);
    const duplicateFilePath = path.join(FLYER_STORAGE_PATH, `${fileHash}.jpg`);

    if (isDuplicate) {
      console.warn(`⚠️ Duplicate detected! File already exists: ${duplicateFilePath}`);
      return NextResponse.json(
        {
          error: "Duplicate flyer detected - this file has already been uploaded",
          isDuplicate: true,
          fileHash: fileHash,
          existingFilePath: duplicateFilePath,
          message:
            "This exact flyer has already been uploaded. You can find and delete the existing flyer below if you want to re-upload it.",
        },
        { status: 409 }
      );
    }


    // Ensure storage directory exists
    if (!existsSync(FLYER_STORAGE_PATH)) {
      await mkdir(FLYER_STORAGE_PATH, { recursive: true });
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

    // Save optimized image
    const filename = `${fileHash}.jpg`;
    const filepath = path.join(FLYER_STORAGE_PATH, filename);
    await writeFile(filepath, optimizedBuffer);

    // Calculate sizes for reporting
    const originalSize = buffer.length;
    const optimizedSize = optimizedBuffer.length;
    const savedBytes = originalSize - optimizedSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      filename,
      hash: fileHash,
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercent: `${savedPercent}%`,
      path: `/api/flyers/${filename}`,
    });
  } catch (error) {
    console.error("Flyer upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload flyer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
