import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

/**
 * API endpoint to physically delete flyer image files from the filesystem
 * This is called when a flyer is deleted from the database
 */
export async function POST(request: NextRequest) {
  try {
    const { filepath } = await request.json();

    if (!filepath) {
      return NextResponse.json({ error: "No filepath provided" }, { status: 400 });
    }

    // Extract filename from filepath
    // Handles both formats:
    // Old: /STEPFILES/event-flyers/filename.jpg
    // New: /api/flyers/filename.jpg
    let filename: string;
    if (filepath.includes("/api/flyers/")) {
      filename = filepath.split("/api/flyers/")[1];
    } else if (filepath.includes("/STEPFILES/event-flyers/")) {
      filename = filepath.split("/STEPFILES/event-flyers/")[1];
    } else {
      filename = path.basename(filepath);
    }

    // Construct full path to the file
    const fullPath = path.join(
      "/root/websites/events-stepperslife/STEPFILES/event-flyers",
      filename
    );

    // Delete the physical file
    try {
      await unlink(fullPath);

      // Verify file is actually gone
      const { existsSync } = require("fs");
      if (existsSync(fullPath)) {
        console.error(`⚠️ File still exists after deletion attempt: ${fullPath}`);
        throw new Error("File deletion verification failed - file still exists");
      }


      return NextResponse.json({
        success: true,
        message: "File deleted and verified successfully",
        deletedPath: fullPath,
      });
    } catch (unlinkError: any) {
      // If file doesn't exist, that's okay - it's already gone
      if (unlinkError.code === "ENOENT") {
        return NextResponse.json({
          success: true,
          message: "File already deleted or doesn't exist",
          deletedPath: fullPath,
        });
      }

      // Other errors are actual problems
      console.error(`❌ Failed to delete file: ${fullPath}`, unlinkError);
      throw unlinkError;
    }
  } catch (error) {
    console.error("❌ Error deleting flyer file:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
