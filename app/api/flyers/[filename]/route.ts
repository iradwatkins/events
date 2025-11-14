import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const FLYER_STORAGE_PATH = "/root/websites/events-stepperslife/STEPFILES/event-flyers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: Only allow .jpg files and prevent directory traversal
    if (!filename.endsWith(".jpg") || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filepath = path.join(FLYER_STORAGE_PATH, filename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const imageBuffer = await readFile(filepath);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving flyer:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
