import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  // Initialize OpenAI client only when needed
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "placeholder-key-for-build",
  });
  try {
    const { filepath } = await request.json();

    if (!filepath) {
      return NextResponse.json(
        { error: "No filepath provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables." },
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

    // Call OpenAI Vision API to extract event data
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting event information from flyers.
Extract ALL relevant information from the event flyer and return it as JSON.

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
Return ONLY valid JSON, no markdown formatting.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all event information from this flyer:",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.2, // Low temperature for consistent extraction
    });

    const extractedText = response.choices[0]?.message?.content;
    if (!extractedText) {
      throw new Error("No response from OpenAI");
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
      console.error("Failed to parse OpenAI response:", extractedText);
      throw new Error("Failed to parse AI response as JSON");
    }

    return NextResponse.json({
      success: true,
      extractedData,
      tokensUsed: response.usage?.total_tokens,
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
