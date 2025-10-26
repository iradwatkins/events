import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { filepath } = await request.json();

    if (!filepath) {
      return NextResponse.json(
        { error: "No filepath provided" },
        { status: 400 }
      );
    }

    // Check for Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
          details: "Please add GEMINI_API_KEY or GOOGLE_API_KEY to environment variables."
        },
        { status: 500 }
      );
    }

    // Read the flyer image from disk
    const fullPath = path.join(
      "/root/websites/events-stepperslife/STEPFILES/event-flyers",
      path.basename(filepath)
    );
    const imageBuffer = await readFile(fullPath);
    const base64Image = imageBuffer.toString("base64");

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert at extracting event information from flyers.
Extract ALL relevant information from this event flyer and return it as JSON.

Extract the following fields:
- eventName: The name/title of the event
- date: The event date (extract raw text, e.g., "Saturday, March 15, 2025")
- time: The event time (e.g., "8:00 PM - 2:00 AM" or "Doors at 8pm")
- location: Full location details (venue name + address if available)
- venueName: Just the venue name if separate from address
- address: Street address
- city: City name
- state: State (2-letter code if possible, e.g., "GA")
- zipCode: Zip code if visible
- description: Brief description of the event (1-2 sentences summarizing what's on the flyer)
- hostOrganizer: Name of the host, organizer, or promoter
- contactInfo: Any contact information (phone, email, website, social media)
- ticketPrice: Ticket price if mentioned (e.g., "$25", "Free", "$15-$30")
- ageRestriction: Age restriction if mentioned (e.g., "21+", "18+", "All ages")
- specialNotes: Any special notes (dress code, special guests, etc.)

If any field is not clearly visible on the flyer, set it to null.
Return ONLY valid JSON, no markdown formatting or explanation.`;

    // Call Gemini Vision API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const extractedText = response.text();

    if (!extractedText) {
      throw new Error("No response from Gemini");
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = extractedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", extractedText);
      throw new Error("Failed to parse AI response as JSON");
    }

    return NextResponse.json({
      success: true,
      extractedData,
      provider: "gemini",
    });
  } catch (error) {
    console.error("AI extraction error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract flyer data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
