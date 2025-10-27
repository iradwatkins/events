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

    // Extract filename from filepath (handles both old and new format)
    // Old format: /STEPFILES/event-flyers/filename.jpg
    // New format: /api/flyers/filename.jpg
    const filename = filepath.includes('/api/flyers/')
      ? filepath.split('/api/flyers/')[1]
      : path.basename(filepath);

    // Read the flyer image from disk
    const fullPath = path.join(
      "/root/websites/events-stepperslife/STEPFILES/event-flyers",
      filename
    );
    const imageBuffer = await readFile(fullPath);
    const base64Image = imageBuffer.toString("base64");

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `EXPERT EVENT FLYER EXTRACTION PROMPT

You are an expert at extracting event information from party flyers, club flyers, and promotional event materials.

Your task: Extract ALL information from this flyer and return it as clean, structured JSON.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL MANDATORY FIELDS (CANNOT BE NULL)
═══════════════════════════════════════════════════════════════════

These fields are ABSOLUTELY REQUIRED. Search the ENTIRE flyer - top, bottom, corners, watermarks, background text - EVERYWHERE.

1. EVENT NAME (eventName)
   - The main title, theme, or name of the event
   - This is usually the largest or most prominent text
   - Examples: "Summer Night Bash", "New Year's Eve Party", "DJ Smooth Presents"

2. EVENT DATE (eventDate)
   - Extract the date and format it as: "Day, Month DD, YYYY"
   - Always use full month name and 4-digit year
   - Examples of CORRECT format:
     * "Saturday, November 25, 2025"
     * "Friday, January 8, 2026"
     * "Sunday, December 27, 2025"
   - If flyer shows "Sat, Dec 27, 2025" → format as "Saturday, December 27, 2025"
   - If flyer shows "11/25/25" → format as "Saturday, November 25, 2025"
   - If flyer shows "1ST SATURDAY NOV. 1ST, 2025" → format as "Saturday, November 1, 2025"

3. EVENT TIME (eventTime)
   - Extract and format the start time as: "H:MM PM" or "H:MM AM"
   - Always include space before AM/PM
   - Examples of CORRECT format:
     * "7:00 PM"
     * "9:00 PM"
     * "11:30 PM"
   - If flyer shows "7PM" → format as "7:00 PM"
   - If flyer shows "9p" → format as "9:00 PM"
   - If flyer shows "8P.M" → format as "8:00 PM"

4. VENUE NAME (venueName)
   - The name of the location/club/venue
   - Look for words like: Venue, @, At, Location, Where, Club, Lounge, or just a bold location name
   - Examples: "The Grand Ballroom", "Club Paradise", "Marriott Hotel Downtown"

5. CITY (city)
   - Extract the city name
   - Examples: "Atlanta", "Chicago", "Los Angeles", "Miami"

6. STATE (state)
   - Extract state as 2-letter abbreviation if shown (GA, IL, CA, FL, NY)
   - If full name shown, extract that (Georgia, Illinois, California)
   - Look for formats like: "Atlanta, GA" / "Atlanta • GA" / "Atlanta | GA"

⚠️ IF YOU CANNOT FIND ANY OF THESE 6 FIELDS AFTER SEARCHING THE ENTIRE FLYER:
Return this error JSON instead:
{
  "error": "EXTRACTION_FAILED",
  "message": "Could not locate [missing field names]. Searched entire flyer including all text, watermarks, and design elements.",
  "partialData": {include any fields you DID find}
}

═══════════════════════════════════════════════════════════════════
📋 ADDITIONAL FIELDS (Extract if present, null if not)
═══════════════════════════════════════════════════════════════════

7. EVENT END DATE (eventEndDate)
   - Only for multi-day events (weekend events, festivals, etc.)
   - Extract EXACT end date as shown: "January 9th" / "Sunday, Dec 29"
   - If single-day event: null

8. EVENT END TIME (eventEndTime)
   - The end time if shown: "2:00 AM" / "til Late" / "Midnight"
   - If not shown: null

9. FULL ADDRESS (address)
   - MUST include street number AND street name: "123 Main Street" / "456 Peachtree Rd NE, Suite 200"
   - NEVER just the street name alone - must have the number
   - If address incomplete (just says "Downtown" or city name): extract what's there
   - If no street address visible: null

10. ZIP CODE (zipCode)
    - Extract if visible: "30303" / "60601-1234"
    - If not shown: null

11. TIMEZONE (eventTimezone)
    - ONLY if explicitly mentioned on flyer: "EST", "PST", "CST", "EDT"
    - If NOT explicitly shown: null (system will determine from city/state)

12. HOST/ORGANIZER (hostOrganizer)
    - The person, company, or organization hosting/presenting the event
    - Look for these phrases:
      * Presented by [Name]
      * Hosted by [Name]
      * [Name] Presents
      * Brought to you by [Name]
      * Promoted by [Name]
      * A [Name] Production
      * In Association with [Name]

    - Extract the NAME after these phrases
    - If multiple hosts: "Company A, Company B"
    - DO NOT extract performer/DJ names as hosts (those go in description)
    - If not shown: null

13. TICKET PRICES (ticketPrices)
    - Extract ALL ticket tiers as an array of objects
    - Each ticket: {name: "tier name", price: "amount", description: "details if any"}

    🎫 IMPORTANT TICKET RULES:
    - If you see "Ticket", "Tickets Available", "Purchase Tickets", "Buy Tickets" → This is NOT a free event
    - Look for the actual prices on the flyer

    Common formats:
    - "$20 Advance / $25 Door" → [{name: "Advance", price: "$20"}, {name: "Door", price: "$25"}]
    - "Early Bird $15 / Advance $20 / Door $25" → three separate ticket objects
    - "VIP: $50 / General Admission: $20" → two separate ticket objects
    - "Free before 10PM / $15 After" → two separate ticket objects
    - "Weekend Pass: $100 / Day Pass: $40" → two separate ticket objects

    - If truly FREE with no tickets mentioned: []
    - If prices not visible: []

14. AGE RESTRICTION (ageRestriction)
    - Common formats: "21+", "18+", "18 and over", "All ages", "Ages 21 and up"
    - If not mentioned: null

15. CONTACT INFORMATION (contacts)
    - Extract ALL contacts as array of objects
    - Each contact: {name, phoneNumber, email, role, socialMedia: {instagram, facebook, twitter, tiktok}}

    - Look for phrases like:
      * "For more information contact..."
      * "Info: [phone/email]"
      * "RSVP: [contact]"
      * Social media handles (@username or full URLs)

    - Parse phone numbers carefully: "708 527 0378" / "(708) 527-0378" / "708-527-0378"
    - Extract social handles: "@djsmooth" / "instagram.com/eventname"
    - If person has title: include as role: "Event Coordinator", "Promoter", "DJ"

    - IMPORTANT: In socialMedia object, ONLY include fields that have values
    - DO NOT include fields with null or empty strings
    - Example: If only Instagram found, return {socialMedia: {instagram: "@handle"}}
    - If NO social media found, omit the socialMedia field entirely

    - If no contacts shown: []

16. COMPREHENSIVE DESCRIPTION (description)
    - This should include EVERYTHING visible on the flyer
    - Write as detailed paragraphs covering:
      * Event overview and theme
      * ALL performers, DJs, MCs, special guests (list every name you see)
      * ALL activities, performances, entertainment scheduled
      * Music genres or types of entertainment
      * Dress code or theme requirements
      * Prizes, giveaways, contests, special offers
      * Food, drinks, amenities mentioned
      * Parking information
      * Sponsors mentioned
      * Any other text, details, or information on the flyer

    - Make this VERY detailed - capture every piece of information
    - If flyer has very little text: describe what IS there

17. SPECIAL NOTES (specialNotes)
    - Anything important not captured in other fields
    - Examples: "Limited capacity", "Must RSVP", "Bring ID", "Cash only bar"
    - If nothing special: null

18. SAVE THE DATE CHECK (containsSaveTheDateText)
    - Boolean: true or false ONLY
    - Does the flyer contain the exact phrase "save the date" or "save-the-date"?
    - Only return true if you literally see those words
    - Return false if not present

19. EVENT TYPE (eventType)
    - Determine using this EXACT logic in order:

    STEP 1: If containsSaveTheDateText is true → return "SAVE_THE_DATE"
    STEP 2: If ticketPrices array is empty OR all prices say "Free" → return "FREE_EVENT"
    STEP 3: If ticketPrices array has any paid tickets → return "TICKETED_EVENT"

    - Return EXACTLY one of: "FREE_EVENT", "TICKETED_EVENT", "SAVE_THE_DATE"

20. EVENT CATEGORIES (categories)
    - Select ALL that apply from this list:
      * "Set" - stepping set events
      * "Workshop" - instructional or learning events
      * "Save the Date" - advance notice events
      * "Cruise" - boat or cruise events
      * "Outdoors Steppin" - outdoor stepping events
      * "Holiday Event" - themed around a holiday
      * "Weekend Event" - multi-day weekend events

    - Return as array: ["Weekend Event", "Holiday Event"]
    - If none apply: []

═══════════════════════════════════════════════════════════════════
📅 MULTI-DAY EVENT SPECIAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════

If this is a MULTI-DAY EVENT (weekend event, festival, conference, etc.), follow these additional rules:

🔍 HOW TO IDENTIFY MULTI-DAY EVENTS:
- Look for date ranges: "November 15th-17th" / "Jan 8-9" / "Dec 27-29"
- Look for multiple days listed: "Friday, Saturday, Sunday"
- Look for phrases: "3-Day Event", "Weekend Event", "All Weekend Long"
- Look for "Day 1, Day 2, Day 3" schedules

📋 REQUIRED MULTI-DAY EXTRACTION:

1. **eventDate** (Start Date)
   - Extract the FIRST/START date and format as "Day, Month DD, YYYY"
   - Examples:
     * "November 15th-17th" → eventDate: "Friday, November 15, 2025"
     * "Friday-Sunday, Jan 8-10" → eventDate: "Friday, January 8, 2026"
     * "Dec 27, 28, 29" → eventDate: "Friday, December 27, 2025"

2. **eventEndDate** (End Date)
   - Extract the LAST/END date and format as "Day, Month DD, YYYY"
   - Examples:
     * "November 15th-17th" → eventEndDate: "Sunday, November 17, 2025"
     * "Friday-Sunday, Jan 8-10" → eventEndDate: "Sunday, January 10, 2026"
     * "Dec 27, 28, 29" → eventEndDate: "Sunday, December 29, 2025"

3. **eventTime** (Start Time)
   - Extract and format the time for Day 1 as "H:MM PM" or "H:MM AM"
   - If different times each day, use the EARLIEST time shown
   - Example: "Starts Friday at 7PM" → eventTime: "7:00 PM"
   - Example: "Friday 7PM / Saturday 8PM" → eventTime: "7:00 PM" (earliest)

4. **eventEndTime** (End Time)
   - Extract and format the end time for the final day as "H:MM PM" or "H:MM AM"
   - Example: "Sunday til Midnight" → eventEndTime: "12:00 AM"
   - Example: "Ends at 2AM" → eventEndTime: "2:00 AM"
   - If each day has different hours, note in description

5. **categories**
   - ALWAYS include "Weekend Event" in the categories array
   - Example: categories: ["Weekend Event", "Holiday Event"]

6. **description**
   - Must include the FULL SCHEDULE if shown on flyer
   - Break down what happens each day
   - Example format:
     "This is a 3-day weekend event. Friday, November 15th: Opening night
     party starting at 7PM featuring DJ Smooth. Saturday, November 16th:
     Main event from 8PM-2AM with performances by Artist X and Artist Y.
     Sunday, November 17th: Closing brunch and day party 12PM-6PM."

📌 MULTI-DAY DATE FORMAT EXAMPLES YOU'LL SEE:

**Range with Dash:**
- November 15th-17th
- Nov 15-17
- 11/15-11/17
- Friday-Sunday, Jan 8-10

**Range with "through" or "thru":**
- November 15th through 17th
- Nov 15 thru Nov 17
- Friday through Sunday

**Listed Days:**
- December 27, 28, 29
- Dec 27 • Dec 28 • Dec 29
- Friday, Saturday & Sunday

**Explicit Multi-Day:**
- 3 Days: Nov 15-17
- Weekend: Friday-Sunday
- All Weekend Long: Jan 8-10

**Day-by-Day Breakdown:**
- Friday, November 15th | Saturday, November 16th | Sunday, November 17th
- Day 1: Friday Nov 15 | Day 2: Saturday Nov 16 | Day 3: Sunday Nov 17

🎫 MULTI-DAY TICKET PRICING:

For multi-day events, extract tickets carefully:

**Pass Types (extract as separate tickets):**
- "Weekend Pass: $100" → {name: "Weekend Pass", price: "$100"}
- "3-Day Pass: $150" → {name: "3-Day Pass", price: "$150"}
- "Full Event Pass: $200" → {name: "Full Event Pass", price: "$200"}

**Day Passes (extract each day separately):**
- "Friday Pass: $30 / Saturday Pass: $40 / Sunday Pass: $30"
  → [
      {name: "Friday Pass", price: "$30"},
      {name: "Saturday Pass", price: "$40"},
      {name: "Sunday Pass", price: "$30"}
    ]

**Bundle Options:**
- "Single Day $30 / Weekend Pass $75"
  → [
      {name: "Single Day", price: "$30"},
      {name: "Weekend Pass", price: "$75"}
    ]

⚠️ CRITICAL MULTI-DAY VALIDATION:

Before returning JSON, verify:
✅ eventDate has the FIRST date
✅ eventEndDate has the LAST date (not null for multi-day events)
✅ eventTime has the EARLIEST time (if multiple times shown)
✅ "Weekend Event" is in categories array
✅ description explains what happens each day if schedule is shown
✅ Ticket pricing includes all pass types and day options

EXAMPLE MULTI-DAY EXTRACTION:

Flyer shows: "SUMMER WEEKEND FEST / JUNE 14-16 / FRIDAY-SUNDAY /
Weekend Pass $99 or Single Day $40"

Correct extraction:
{
  "eventName": "Summer Weekend Fest",
  "eventDate": "June 14th",
  "eventEndDate": "June 16th",
  "eventTime": "[extract earliest time from flyer]",
  "eventEndTime": "[extract latest time from flyer]",
  "ticketPrices": [
    {name: "Weekend Pass", price: "$99", description: "All 3 days"},
    {name: "Single Day", price: "$40", description: "One day admission"}
  ],
  "categories": ["Weekend Event"]
}

═══════════════════════════════════════════════════════════════════
📤 JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════

Return this EXACT structure:

{
  "eventName": "string (REQUIRED)",
  "eventDate": "string (REQUIRED - exact text from flyer)",
  "eventEndDate": "string or null",
  "eventTime": "string (REQUIRED - exact text from flyer)",
  "eventEndTime": "string or null",
  "eventTimezone": "string or null",
  "venueName": "string (REQUIRED)",
  "address": "string or null",
  "city": "string (REQUIRED)",
  "state": "string (REQUIRED)",
  "zipCode": "string or null",
  "hostOrganizer": "string or null",
  "description": "string (detailed)",
  "contacts": [
    {
      "name": "string",
      "phoneNumber": "string or null",
      "email": "string or null",
      "role": "string or null",
      "socialMedia": {
        "instagram": "string (ONLY if found - do not include if null)",
        "facebook": "string (ONLY if found - do not include if null)",
        "twitter": "string (ONLY if found - do not include if null)",
        "tiktok": "string (ONLY if found - do not include if null)"
      }
    }
  ],
  "ticketPrices": [
    {
      "name": "string",
      "price": "string",
      "description": "string"
    }
  ],
  "ageRestriction": "string or null",
  "specialNotes": "string or null",
  "containsSaveTheDateText": boolean,
  "eventType": "FREE_EVENT or TICKETED_EVENT or SAVE_THE_DATE",
  "categories": ["array of applicable categories"]
}

CRITICAL RULES:
✅ Return ONLY valid JSON - no markdown, no code blocks, no explanations
✅ Use null for missing fields (not empty strings, not "N/A", not "Not found")
✅ Empty arrays [] for contacts/tickets/categories if none found
✅ Extract dates and times EXACTLY as shown - do not convert or reformat
✅ Search the ENTIRE flyer for required fields before giving up
✅ Make description field very comprehensive and detailed

═══════════════════════════════════════════════════════════════════
🔍 EXTRACTION STRATEGY
═══════════════════════════════════════════════════════════════════

1. SCAN ENTIRE FLYER FIRST
   - Look at all areas: top, middle, bottom, corners, sides
   - Check for watermarks, background text, rotated text
   - Note all visible text before extracting

2. IDENTIFY REQUIRED FIELDS FIRST
   - Event name (usually largest/most prominent)
   - Date (search everywhere - can be in any format)
   - Time (search everywhere - many possible formats)
   - Venue name (look for location indicators)
   - City and State

3. EXTRACT ADDITIONAL DETAILS
   - Look for organizer phrases
   - Find ticket pricing information
   - Locate contact information
   - Read all remaining text for description

4. VALIDATE BEFORE RETURNING
   - Confirm all 6 required fields are present
   - Check that dates/times are extracted exactly as shown
   - Verify JSON is valid

BEGIN EXTRACTION NOW.`;

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
    let extractedData: any;
    try {
      // Remove markdown code blocks if present (handles all variations)
      let cleanedText = extractedText.trim();

      // Remove opening markdown code block (```json or ```)
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.substring(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.substring(3);
      }

      // Remove closing markdown code block
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }

      cleanedText = cleanedText.trim();

      extractedData = JSON.parse(cleanedText);

      // Check if AI returned an error response
      if (extractedData.error === "EXTRACTION_FAILED") {
        console.error("🚨 AI EXTRACTION FAILED:", extractedData.message);
        console.error("Partial data extracted:", extractedData.partialData);

        const partialData = extractedData.partialData || {};

        // For Save the Date flyers, only eventName and eventDate are required
        const isSaveTheDate = partialData.containsSaveTheDateText === true || partialData.eventType === "SAVE_THE_DATE";

        if (isSaveTheDate) {
          // Save the Date flyers only need name and date
          if (partialData.eventName && partialData.eventDate) {
            console.log("✅ Save the Date flyer - accepting with partial data (name + date only)");
            // Return success with partial data
            return NextResponse.json({
              success: true,
              extractedData: partialData,
              provider: "gemini",
              warning: "Save the Date flyer - missing venue/time details (expected)"
            });
          }
        }

        // For regular flyers, this is an error
        return NextResponse.json({
          success: false,
          error: "INCOMPLETE_FLYER_DATA",
          message: extractedData.message || "The flyer is missing required information. Please ensure the flyer includes: event name, date, time, venue name, city, and state.",
          partialData: partialData,
          suggestion: isSaveTheDate
            ? "Save the Date flyer is missing event name or date."
            : "This may be a Save the Date flyer. Consider adding missing information manually, or upload a complete event flyer with all details."
        }, { status: 400 });
      }

      // Validate required fields are present
      // For Save the Date flyers, only require name and date
      const isSaveTheDate = extractedData.containsSaveTheDateText === true || extractedData.eventType === "SAVE_THE_DATE";
      const requiredFields = isSaveTheDate
        ? ["eventName", "eventDate"]
        : ["eventName", "eventDate", "eventTime", "venueName", "city", "state"];
      const missingFields = requiredFields.filter(field => !extractedData[field]);

      if (missingFields.length > 0) {
        console.error("⚠️ MISSING REQUIRED FIELDS:", missingFields);
        console.error("Extracted data:", extractedData);

        // Special emphasis on date/time being missing
        const missingDateTime = missingFields.filter(f => f === "eventDate" || f === "eventTime");
        if (missingDateTime.length > 0) {
          console.error("🚨 CRITICAL: Date and/or Time are MISSING from extraction!");
          console.error("This is MANDATORY information. The AI must search the entire flyer for date/time.");
          throw new Error(`❌ MANDATORY FIELDS MISSING: ${missingFields.join(", ")}. Date and Time are REQUIRED - extraction cannot proceed without them.`);
        }

        throw new Error(`AI failed to extract required fields: ${missingFields.join(", ")}`);
      }

      if (isSaveTheDate) {
        console.log("✅ [AI Extraction Success] Save the Date flyer - name + date extracted:");
        console.log({
          eventName: extractedData.eventName,
          eventDate: extractedData.eventDate,
          eventEndDate: extractedData.eventEndDate || "(single-day event)",
          eventType: "SAVE_THE_DATE",
        });
      } else {
        console.log("✅ [AI Extraction Success] All required fields present:");
        console.log({
          eventName: extractedData.eventName,
          eventDate: extractedData.eventDate,
          eventEndDate: extractedData.eventEndDate || "(single-day event)",
          eventTime: extractedData.eventTime,
          eventEndTime: extractedData.eventEndTime || "(not specified)",
          venueName: extractedData.venueName,
          city: extractedData.city,
          state: extractedData.state,
        });
      }
    } catch (parseError) {
      console.error("❌ FAILED TO PARSE GEMINI RESPONSE");
      console.error("Raw response (first 500 chars):", extractedText.substring(0, 500));
      console.error("Raw response (last 500 chars):", extractedText.substring(Math.max(0, extractedText.length - 500)));
      console.error("Parse error:", parseError instanceof Error ? parseError.message : String(parseError));
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
