import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const storagePath = getStoragePath();

    console.log(`[Product Image] Request for: ${filename}`);
    console.log(`[Product Image] Storage path: ${storagePath}`);
    console.log(`[Product Image] NODE_ENV: ${process.env.NODE_ENV}`);

    // Security: Only allow .jpg files and prevent directory traversal
    if (!filename.endsWith(".jpg") || filename.includes("..") || filename.includes("/")) {
      console.error(`[Product Image] Invalid filename: ${filename}`);
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filepath = path.join(storagePath, filename);
    console.log(`[Product Image] Full path: ${filepath}`);

    if (!existsSync(filepath)) {
      console.error(`[Product Image] File not found: ${filepath}`);
      return NextResponse.json(
        { error: "File not found", path: filepath, storageDir: storagePath },
        { status: 404 }
      );
    }

    const imageBuffer = await readFile(filepath);
    console.log(`[Product Image] Successfully loaded: ${filename} (${imageBuffer.length} bytes)`);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Product Image] Error serving image:", error);
    return NextResponse.json(
      {
        error: "Failed to load image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
