import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { filepath } = await request.json();

    if (!filepath) {
      return NextResponse.json({ error: "No filepath provided" }, { status: 400 });
    }

    // Ollama runs locally - no API key needed
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

    // Extract filename from filepath (handles both old and new format)
    // Old format: /STEPFILES/event-flyers/filename.jpg
    // New format: /api/flyers/filename.jpg
    const filename = filepath.includes("/api/flyers/")
      ? filepath.split("/api/flyers/")[1]
      : path.basename(filepath);

    // Read the flyer image from disk
    const fullPath = path.join(
      "/root/websites/events-stepperslife/STEPFILES/event-flyers",
      filename
    );
    const imageBuffer = await readFile(fullPath);
    const base64Image = imageBuffer.toString("base64");

    // Ollama Vision API
    const prompt = `EXPERT EVENT FLYER EXTRACTION PROMPT - TWO-PHASE EXTRACTION

You are an expert at extracting event information from party flyers, club flyers, and promotional event materials.

Your task: Extract ALL text from this flyer using a TWO-PHASE APPROACH and return it as clean, structured JSON.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL: SAVE THE DATE FLYERS - DATE IS MANDATORY
═══════════════════════════════════════════════════════════════════

⚠️ **IF THIS IS A "SAVE THE DATE" FLYER:**

The DATE is the ABSOLUTE MOST CRITICAL piece of information. You MUST find it.

**How to identify Save the Date flyers:**
- Contains text: "save the date", "save-the-date", "STD"
- Contains: "details to follow", "coming soon", "more info coming"
- Has event name and date but missing venue/time details

**FOR SAVE THE DATE FLYERS - DATE EXTRACTION RULES:**

1. **THE DATE IS MANDATORY - YOU MUST FIND IT**
   - Search the ENTIRE flyer for date information
   - Look EVERYWHERE: top, bottom, center, corners, sides, watermarks, background
   - Check ALL text sizes: large headlines, small print, decorative text
   - Look for ANY date format: "January 8-11", "Jan 8", "1/8/26", "January 2026"

2. **Search locations to find dates:**
   - Large prominent text in the center
   - Small text at the bottom
   - Decorative text in corners
   - Background watermarks
   - Text rotated or at angles
   - Fine print or footer text
   - Date integrated into graphics or logos
   - Secondary headlines below main title

3. **Date formats you might find:**
   - Full dates: "January 8-11, 2026" / "March 12-15, 2026"
   - Short dates: "Jan 8-11" / "3/12-15"
   - Date ranges: "November 20-23" / "Dec 27-29"
   - Single dates: "January 8th" / "March 15, 2026"
   - Month/year only: "January 2026" / "Summer 2026"
   - Abbreviated: "NOV 20-23" / "JAN 8-11"

4. **If you cannot find the date:**
   - Search again - look at EVERY piece of text on the flyer
   - Check if dates are embedded in graphics or stylized text
   - Look for partial date info (month only, year only) and extract that
   - NEVER give up - the date MUST be somewhere on the flyer

5. **For Save the Date flyers:**
   - Description field: MUST include "Save the Date" and the DATE
   - eventName: Required
   - **eventDate: ABSOLUTELY REQUIRED - THIS IS THE MOST IMPORTANT FIELD**
   - venueName: Can be null (details to follow)
   - eventTime: Can be null (details to follow)
   - city/state: Extract if shown, null if not
   - containsSaveTheDateText: Must be true
   - eventType: Must be "SAVE_THE_DATE"

**REMEMBER: For Save the Date flyers, finding the DATE is your PRIMARY MISSION.**
If the flyer says "Save the Date" but you cannot find a date, search again.
The date MUST be extracted - it is the whole purpose of a Save the Date flyer.

═══════════════════════════════════════════════════════════════════
🎯 TWO-PHASE EXTRACTION STRATEGY
═══════════════════════════════════════════════════════════════════

**PHASE 1: COMPLETE TEXT EXTRACTION WITH FORMATTING (MOST IMPORTANT)**
First, you MUST extract 100% of ALL visible text from the entire flyer image.
This goes in the "description" field and is the foundation for Phase 2.

Read the ENTIRE flyer carefully and capture:
- Main event title/headline
- All dates and times mentioned anywhere (including END time if shown)
- Venue name and address details
- ALL performer names, DJ names, special guests
- **TICKET PRICING INFORMATION** (very important - include all ticket types, prices, and details)
- Contact information (phone, email, social media)
- Age restrictions, dress codes, parking info
- Sponsors, hosts, organizers
- Fine print, disclaimers, legal text
- Any other visible text (don't skip anything!)

🚫 **CRITICAL EXCLUSION - DO NOT INCLUDE DESIGNER INFORMATION IN DESCRIPTION:**
- **COMPLETELY EXCLUDE** any text about graphic design, flyer design, or designer credits
- **DO NOT include** phrases like:
  * "Design by [name]"
  * "Designed by [name]"
  * "Graphic design by [name]"
  * "Graphics by [name]"
  * "Flyer by [name]"
  * "Contact [name] for graphic design"
  * "Contact us for flyers/graphics"
- **Skip these lines entirely** - do not include them in the description
- Only include text relevant to the EVENT itself, not the flyer's creation

**CRITICAL: FORMAT THE DESCRIPTION WITH PROPER STRUCTURE**

The description must be formatted with clear sections and line breaks for readability:

1. **Opening Paragraph**: Brief overview of the event
2. **Event Details Section**: Date, time, location info
3. **Entertainment/Features**: DJs, performers, special guests, music, etc.
4. **Ticket Information Section**: All pricing, where to purchase
5. **Additional Details**: Age restrictions, dress code, parking, etc.
6. **Contact Information**: How to get more info or RSVP

**CRITICAL JSON FORMATTING:**
- In the JSON output, use the escape sequence \\n (backslash-n) for line breaks
- DO NOT use actual/literal newlines in the JSON string - this breaks JSON parsing
- Example CORRECT: "description": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3"
- Example WRONG: "description": "Paragraph 1
Paragraph 2" (actual newline breaks JSON)

Use double line breaks (\\n\\n) between sections for clear separation.
Use single line breaks (\\n) within sections when listing multiple items.

**Example format for description (as it appears in JSON):**

"description": "[Event name] presents [theme/celebration]. [Brief overview of what the event is about].\\n\\nThe event takes place on [date] from [time] at [venue name], located at [address].\\n\\nMusic by [DJ name]. Special performances by [artists]. [MC info]. [Additional entertainment details].\\n\\nTickets: [List all ticket types and prices]. [Where to purchase tickets]. [Any early bird or discount info].\\n\\n[Age restrictions]. [Dress code]. [Parking information]. [Any other important details].\\n\\nFor more information, contact [name] at [phone] or [email]. [Social media handles]."

**REMEMBER:**
- Use \\n (escaped newline) in the JSON, NOT actual newlines
- The description value must be a valid JSON string with escaped newlines
- DO NOT use markdown headers (#) or bullet points (•/-/*) - use plain text with \\n line breaks only

**PHASE 2: STRUCTURED FIELD EXTRACTION**
After Phase 1 is complete, use the description text you extracted to fill out the structured fields below (eventName, eventDate, eventTime, venueName, etc.).

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL MANDATORY FIELDS (CANNOT BE NULL)
═══════════════════════════════════════════════════════════════════

These fields are ABSOLUTELY REQUIRED. Use the description text from Phase 1 to extract these.

1. DESCRIPTION (description) - **PHASE 1: EXTRACT FIRST WITH FORMATTING**
   - This is the FIRST and MOST IMPORTANT field
   - Extract 100% of ALL visible text from the entire flyer
   - **MUST be formatted with proper structure using line breaks (\\n\\n between sections)**
   - **CRITICAL: Use escaped newlines (\\n) in the JSON string, NOT actual newlines which break JSON**
   - Organize into clear sections: Overview, Event Details, Entertainment, Tickets, Additional Info, Contact
   - Use double line breaks (\\n\\n) between major sections
   - Use single line breaks (\\n) within sections for lists
   - This text will be the source for all other fields
   - Make this VERY comprehensive and detailed
   - **MUST include a dedicated ticket pricing section** listing all ticket types, prices, and where to purchase
   - **Include END time if shown** on the flyer (when the event ends)
   - **DO NOT use markdown formatting** - plain text with line breaks only
   - **JSON FORMAT:** "description": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3"

   🚫 **EXCLUDE from description:**
   - **NEVER include** graphic designer credits, "Design by...", "Flyer by...", designer contact info
   - **Skip these lines completely** - they are not event information

   - Example structure:
     "[Overview paragraph]\\n\\n[Event details: date, time, end time, location]\\n\\n[Entertainment details]\\n\\n[Ticket pricing section]\\n\\n[Additional details]\\n\\n[Contact information]"

2. EVENT NAME (eventName) - **PHASE 2: From description**
   - The main title, theme, or name of the event
   - This is usually the largest or most prominent text
   - Examples: "Summer Night Bash", "New Year's Eve Party", "DJ Smooth Presents"

3. EVENT DATE (eventDate) - **PHASE 2: From description** ⚠️ CRITICAL FIELD
   - **FOR SAVE THE DATE FLYERS: THIS IS THE MOST IMPORTANT FIELD - YOU MUST FIND IT**
   - Extract the date EXACTLY as it appears on the flyer - DO NOT REFORMAT OR ADD DAY NAMES
   - Keep the original text from the flyer as-is
   - Examples of CORRECT extraction:
     * Flyer shows "March 12-15, 2026" → extract as "March 12-15, 2026"
     * Flyer shows "Jan 8-11" → extract as "Jan 8-11"
     * Flyer shows "Saturday, November 25, 2025" → extract as "Saturday, November 25, 2025"
     * Flyer shows "11/25/25" → extract as "11/25/25"
     * Flyer shows "NOV 20-23, 2025" → extract as "NOV 20-23, 2025"
   - DO NOT add day names if they're not on the flyer
   - DO NOT reformat the date to a different style
   - The text MUST match exactly what appears in the description field
   - **If this is a Save the Date flyer and you cannot find the date in the description, SEARCH AGAIN. The date MUST be somewhere on the flyer.**

4. EVENT TIME (eventTime) - **PHASE 2: From description**
   - Extract and format the start time as: "H:MM PM" or "H:MM AM"
   - Always include space before AM/PM
   - Examples of CORRECT format:
     * "7:00 PM"
     * "9:00 PM"
     * "11:30 PM"
   - If flyer shows "7PM" → format as "7:00 PM"
   - If flyer shows "9p" → format as "9:00 PM"
   - If flyer shows "8P.M" → format as "8:00 PM"

5. VENUE NAME (venueName) - **PHASE 2: From description**
   - The name of the location/club/venue
   - Look for words like: Venue, @, At, Location, Where, Club, Lounge, or just a bold location name
   - Examples: "The Grand Ballroom", "Club Paradise", "Marriott Hotel Downtown"

6. CITY (city) - **PHASE 2: From description**
   - Extract the city name
   - Examples: "Atlanta", "Chicago", "Los Angeles", "Miami"

7. STATE (state) - **PHASE 2: From description**
   - Extract state as 2-letter abbreviation if shown (GA, IL, CA, FL, NY)
   - If full name shown, extract that (Georgia, Illinois, California)
   - Look for formats like: "Atlanta, GA" / "Atlanta • GA" / "Atlanta | GA"

⚠️ IF YOU CANNOT FIND ANY OF THESE 7 FIELDS AFTER SEARCHING THE ENTIRE FLYER:
Return this error JSON instead:
{
  "error": "EXTRACTION_FAILED",
  "message": "Could not locate [missing field names]. Searched entire flyer including all text, watermarks, and design elements.",
  "partialData": {include any fields you DID find}
}

═══════════════════════════════════════════════════════════════════
📋 ADDITIONAL FIELDS (Extract if present, null if not)
═══════════════════════════════════════════════════════════════════

All fields below should be extracted from the description text you captured in Phase 1.

8. EVENT END DATE (eventEndDate)
   - Only for multi-day events (weekend events, festivals, etc.)
   - Extract EXACT end date as shown: "January 9th" / "Sunday, Dec 29"
   - If single-day event: null

9. EVENT END TIME (eventEndTime) - **IMPORTANT: Extract if present**
   - If the flyer shows when the event ENDS, extract it
   - Format as "H:MM PM" or "H:MM AM": "2:00 AM" / "12:00 AM" (midnight)
   - Also accept: "til Late" / "Midnight" / "til 2AM" → format as "2:00 AM"
   - **ALWAYS look for end time information** - it's valuable for attendees
   - If not shown anywhere on the flyer: null

10. FULL ADDRESS (address)
    - MUST include street number AND street name: "123 Main Street" / "456 Peachtree Rd NE, Suite 200"
    - NEVER just the street name alone - must have the number
    - If address incomplete (just says "Downtown" or city name): extract what's there
    - If no street address visible: null

11. ZIP CODE (zipCode)
    - Extract if visible: "30303" / "60601-1234"
    - If not shown: null

12. TIMEZONE (eventTimezone)
    - ONLY if explicitly mentioned on flyer: "EST", "PST", "CST", "EDT"
    - If NOT explicitly shown: null (system will determine from city/state)

13. HOST/ORGANIZER (hostOrganizer)
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

    🚫 **CRITICAL EXCLUSION - DO NOT EXTRACT DESIGNER INFORMATION:**
    - **NEVER extract** names associated with graphic design/flyer design
    - **IGNORE and EXCLUDE** phrases like:
      * "Design by [name]"
      * "Designed by [name]"
      * "Graphic design by [name]"
      * "Graphics by [name]"
      * "Flyer by [name]"
      * "Contact [name] for graphic design"
      * "Contact us for flyers"
    - Designer credits are NOT organizers and should be completely ignored
    - If not shown: null

14. TICKET PRICES (ticketPrices)
    - DO NOT extract tickets as structured data
    - Leave this field as an empty array: []
    - ALL ticket pricing information should ONLY go in the description field
    - The description field will show where tickets are available and their prices

15. AGE RESTRICTION (ageRestriction)
    - Common formats: "21+", "18+", "18 and over", "All ages", "Ages 21 and up"
    - If not mentioned: null

16. CONTACT INFORMATION (contacts)
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

    🚫 **CRITICAL EXCLUSION - DO NOT EXTRACT DESIGNER CONTACTS:**
    - **NEVER extract** contact information for graphic designers
    - **IGNORE and EXCLUDE** contacts related to:
      * "Contact [name] for graphic design services"
      * "For flyer design contact..."
      * Designer social media handles/portfolios
      * "Graphics/Flyers available from [name]"
    - Only extract contacts relevant to EVENT information (RSVP, tickets, event questions)
    - Designer contacts must be completely excluded

    - If no contacts shown: []

17. SPECIAL NOTES (specialNotes)
    - Anything important not captured in other fields
    - Examples: "Limited capacity", "Must RSVP", "Bring ID", "Cash only bar"
    - If nothing special: null

18. SAVE THE DATE CHECK (containsSaveTheDateText)
    - Boolean: true or false ONLY
    - Does the flyer contain "save the date", "save-the-date", "details to follow", or "coming soon"?
    - Return true if you see ANY of these phrases
    - Return false if not present

19. EVENT TYPE (eventType)
    - Determine using this EXACT logic in order:

    STEP 1: If containsSaveTheDateText is true → return "SAVE_THE_DATE"
    STEP 2: If description mentions "details to follow", "coming soon", or if venue/time info is missing → return "SAVE_THE_DATE"
    STEP 3: Check the description text for pricing:
           - If description mentions "Free", "No cover", "Free admission", "Free entry" → return "FREE_EVENT"
           - If description mentions "$", ticket prices, "Tickets:", entry fee → return "TICKETED_EVENT"
           - If no pricing mentioned at all → return "FREE_EVENT"

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
   - Extract EXACTLY as shown on flyer - DO NOT REFORMAT
   - For date ranges, extract the full range as shown
   - Examples:
     * Flyer shows "November 15th-17th" → eventDate: "November 15th-17th"
     * Flyer shows "Jan 8-10" → eventDate: "Jan 8-10"
     * Flyer shows "March 12-15, 2026" → eventDate: "March 12-15, 2026"
     * Flyer shows "Dec 27, 28, 29" → eventDate: "Dec 27, 28, 29"

2. **eventEndDate** (End Date)
   - For multi-day events, extract the END date if shown separately
   - If the date is shown as a range (e.g., "March 12-15"), leave eventEndDate as null
   - Only use eventEndDate if start and end dates are listed separately
   - Examples:
     * Flyer shows "March 12-15" → eventDate: "March 12-15", eventEndDate: null
     * Flyer shows "Start: March 12 / End: March 15" → eventDate: "March 12", eventEndDate: "March 15"

3. **eventTime** (Start Time)
   - Extract and format the time for Day 1 as "H:MM PM" or "H:MM AM"
   - If different times each day, use the EARLIEST time shown
   - Example: "Starts Friday at 7PM" → eventTime: "7:00 PM"
   - Example: "Friday 7PM / Saturday 8PM" → eventTime: "7:00 PM" (earliest)

4. **eventEndTime** (End Time) - **IMPORTANT: Extract if shown**
   - Extract and format the end time for the final day as "H:MM PM" or "H:MM AM"
   - Example: "Sunday til Midnight" → eventEndTime: "12:00 AM"
   - Example: "Ends at 2AM" → eventEndTime: "2:00 AM"
   - Example: "Saturday 8PM-2AM" → eventEndTime: "2:00 AM"
   - **Look for end time information** - it's valuable for attendees to know when the event ends
   - If each day has different hours, note in description
   - If not shown: null

5. **categories**
   - ALWAYS include "Weekend Event" in the categories array
   - Example: categories: ["Weekend Event", "Holiday Event"]

6. **description**
   - Must include the FULL SCHEDULE if shown on flyer
   - **FORMAT with proper structure using line breaks (\\n\\n)**
   - Break down what happens each day with clear section separation
   - **MUST include ticket pricing section** with all pass types and day passes
   - Example format:
     "[Event name] is a 3-day weekend event taking place [dates].\\n\\nFriday, November 15th: Opening night party starting at 7PM featuring DJ Smooth.\\n\\nSaturday, November 16th: Main event from 8PM-2AM with performances by Artist X and Artist Y.\\n\\nSunday, November 17th: Closing brunch and day party 12PM-6PM.\\n\\nTickets: Weekend Pass $99 for all 3 days, Single Day Pass $40 per day.\\n\\n[Additional details]."

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

For multi-day events, include ALL ticket pricing in the description field:

**Include in description:**
- "Tickets: Weekend Pass $100 for all 3 days"
- "Tickets: 3-Day Pass $150, or Single Day Pass $50 per day"
- "Tickets: Friday Pass $30, Saturday Pass $40, Sunday Pass $30. Weekend Pass $75."

**DO NOT create structured ticket objects - all pricing goes in description only**

⚠️ CRITICAL MULTI-DAY VALIDATION:

Before returning JSON, verify:
✅ eventDate contains the date EXACTLY as shown on flyer (no reformatting)
✅ eventEndDate is null for date ranges (e.g., "March 12-15")
✅ eventTime has the EARLIEST time (if multiple times shown)
✅ "Weekend Event" is in categories array
✅ description explains what happens each day if schedule is shown
✅ description includes ticket pricing section with all pass types and day options
✅ ticketPrices array is empty []
✅ Date in eventDate field matches the date text in description field

EXAMPLE MULTI-DAY EXTRACTION:

Flyer shows: "SUMMER WEEKEND FEST / JUNE 14-16 / FRIDAY-SUNDAY /
Weekend Pass $99 or Single Day $40"

Correct extraction:
{
  "description": "Summer Weekend Fest is a 3-day music festival from June 14-16. Friday night kicks off at 8PM, Saturday main event 7PM-2AM, Sunday closing party 4PM-10PM. Tickets: Weekend Pass $99 for all 3 days, Single Day Pass $40 per day.",
  "eventName": "Summer Weekend Fest",
  "eventDate": "JUNE 14-16",
  "eventEndDate": null,
  "eventTime": "[extract earliest time from flyer]",
  "eventEndTime": "[extract latest time from flyer]",
  "ticketPrices": [],
  "categories": ["Weekend Event"]
}

═══════════════════════════════════════════════════════════════════
📤 JSON OUTPUT FORMAT - TWO-PHASE RESULT
═══════════════════════════════════════════════════════════════════

Return this EXACT structure with DESCRIPTION FIRST:

{
  "description": "string (REQUIRED - PHASE 1: ALL text from flyer, very comprehensive)",
  "eventName": "string (REQUIRED - PHASE 2: From description)",
  "eventDate": "string (REQUIRED - PHASE 2: From description, EXACT text as shown on flyer)",
  "eventEndDate": "string or null (PHASE 2: From description)",
  "eventTime": "string (REQUIRED - PHASE 2: From description, formatted as 'H:MM PM/AM')",
  "eventEndTime": "string or null (PHASE 2: From description)",
  "eventTimezone": "string or null (PHASE 2: From description)",
  "venueName": "string (REQUIRED - PHASE 2: From description)",
  "address": "string or null (PHASE 2: From description)",
  "city": "string (REQUIRED - PHASE 2: From description)",
  "state": "string (REQUIRED - PHASE 2: From description)",
  "zipCode": "string or null (PHASE 2: From description)",
  "hostOrganizer": "string or null (PHASE 2: From description)",
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
  "ticketPrices": [],
  "ageRestriction": "string or null (PHASE 2: From description)",
  "specialNotes": "string or null (PHASE 2: From description)",
  "containsSaveTheDateText": boolean,
  "eventType": "FREE_EVENT or TICKETED_EVENT or SAVE_THE_DATE",
  "categories": ["array of applicable categories"]
}

CRITICAL RULES:
✅ PHASE 1 FIRST: Extract ALL text from flyer → put in description field WITH PROPER FORMATTING
✅ Description MUST use double line breaks (\\n\\n) between sections for readability
✅ **CRITICAL:** In JSON, use escaped newlines (\\n) NOT actual newlines - actual newlines break JSON parsing
✅ NO markdown formatting in description - plain text with line breaks only
✅ PHASE 2 SECOND: Use description text to fill all other structured fields
✅ Return ONLY valid JSON - no markdown, no code blocks, no explanations
✅ Use null for missing fields (not empty strings, not "N/A", not "Not found")
✅ Empty arrays [] for contacts/categories if none found
✅ Description must contain 100% of all visible text from the flyer INCLUDING ticket pricing
✅ ticketPrices array must ALWAYS be empty [] - all pricing goes in description only
✅ All other fields are extracted FROM the description text

🚨 JSON VALIDATION BEFORE RETURNING:
- Verify your JSON is valid by checking all string values use \\n not actual newlines
- Ensure all quotes in text are properly escaped with \\
- Make sure JSON can be parsed without errors

═══════════════════════════════════════════════════════════════════
🔍 TWO-PHASE EXTRACTION STRATEGY - STEP BY STEP
═══════════════════════════════════════════════════════════════════

**STEP 1: COMPLETE TEXT EXTRACTION WITH FORMATTING (PHASE 1)**
   - Scan ENTIRE flyer: top, middle, bottom, corners, sides
   - Check for watermarks, background text, rotated text
   - Note ALL visible text - don't skip anything
   - Extract 100% of all text and put it in the description field
   - **FORMAT with proper structure**: Use double line breaks (\\n\\n) between sections
   - Organize into sections: Overview, Event Details, Entertainment, Tickets, Additional Info, Contact
   - NO markdown formatting - plain text with line breaks only
   - Capture EVERYTHING but make it readable with clear section separation

**STEP 2: STRUCTURED FIELD EXTRACTION (PHASE 2)**
   Now use the description text you just extracted to fill these fields:

   a) IDENTIFY REQUIRED FIELDS:
      - Event name (usually largest/most prominent text in description)
      - **Date (CRITICAL - search description for date text - extract EXACTLY as shown, NO REFORMATTING)**
        * **FOR SAVE THE DATE FLYERS: The date is MANDATORY and THE MOST IMPORTANT field**
        * If you don't see a date in the description, SEARCH THE FLYER AGAIN
        * Look everywhere: headlines, subheadings, corners, bottom, watermarks, fine print
        * The date MUST be found - it's the whole purpose of a Save the Date flyer
      - Time (search description for time formats - can be null for Save the Date)
      - Venue name (look for location indicators in description - can be null for Save the Date)
      - City and State (extract from description)

   b) EXTRACT ADDITIONAL DETAILS:
      - Look for organizer phrases in description
      - Find ticket pricing information in description
      - Locate contact information in description
      - Special notes, age restrictions, etc.

**STEP 3: VALIDATE BEFORE RETURNING**
   - Confirm description field contains ALL text from flyer
   - Confirm all 7 required fields are present (description + 6 structured fields)
   - **CRITICAL:** Verify eventDate field matches the EXACT date text in description (no reformatting)
   - Verify JSON is valid

REMEMBER: Description field is FIRST and MOST IMPORTANT.
All other fields are extracted FROM the description text.
Date fields must contain EXACT text from flyer - DO NOT reformat or add day names.

🚨 FINAL JSON CHECK BEFORE RETURNING:
1. In the description field, did you use \\n (escaped) or actual newlines? → MUST be \\n
2. Can your JSON be parsed without errors? → Test it mentally
3. Are all quotes in text properly escaped with backslash? → "He said \\"hello\\""
4. Did you return ONLY the JSON object, no markdown, no code blocks? → Clean JSON only

If you used actual newlines in the JSON string values, GO BACK and replace them with \\n escape sequences.

BEGIN TWO-PHASE EXTRACTION NOW.`;

    // Call Ollama Vision API
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2-vision:11b",
        prompt: prompt,
        images: [base64Image],
        stream: false,
        options: {
          temperature: 0.1, // Lower temperature for more consistent extraction
          num_predict: 4096, // Allow longer responses for comprehensive extraction
        },
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error("[Ollama] API Error:", errorText);
      throw new Error(`Ollama API error: ${ollamaResponse.status} ${errorText}`);
    }

    const ollamaData = await ollamaResponse.json();
    const extractedText = ollamaData.response;

    if (!extractedText) {
      throw new Error("No response from Ollama");
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

      // Try to parse the JSON
      extractedData = JSON.parse(cleanedText);

      // Post-processing: If description contains literal newlines instead of \n escape sequences,
      // this could have been parsed correctly by JSON.parse. Let's verify it has proper structure.
      if (
        extractedData &&
        extractedData.description &&
        typeof extractedData.description === "string"
      ) {
        // The description should already have \n characters from proper JSON
        // No need to modify it - JSON.parse handles this correctly
      }

      // Check if AI returned an error response
      if (extractedData.error === "EXTRACTION_FAILED") {
        console.error("🚨 AI EXTRACTION FAILED:", extractedData.message);
        console.error("Partial data extracted:", extractedData.partialData);

        const partialData = extractedData.partialData || {};

        // For Save the Date flyers, only eventName and eventDate are required
        const isSaveTheDate =
          partialData.containsSaveTheDateText === true || partialData.eventType === "SAVE_THE_DATE";

        if (isSaveTheDate) {
          // Save the Date flyers only need name and date
          if (partialData.eventName && partialData.eventDate) {
            // Return success with partial data
            return NextResponse.json({
              success: true,
              extractedData: partialData,
              provider: "ollama-llama3.2-vision",
              warning: "Save the Date flyer - missing venue/time details (expected)",
            });
          } else if (!partialData.eventDate) {
            // CRITICAL ERROR: Save the Date flyer without a date
            console.error("🚨 CRITICAL: Save the Date flyer is MISSING THE DATE!");
            console.error(
              "This is unacceptable - the DATE is the most important field on Save the Date flyers."
            );
            console.error("Partial data found:", partialData);
            return NextResponse.json(
              {
                success: false,
                error: "SAVE_THE_DATE_MISSING_DATE",
                message:
                  "This is a Save the Date flyer but THE DATE IS MISSING. The date is the most critical piece of information and MUST be found on the flyer.",
                partialData: partialData,
                suggestion:
                  "Please retry extraction. The AI must search the entire flyer more carefully to find the date.",
              },
              { status: 400 }
            );
          }
        }

        // For regular flyers, this is an error
        return NextResponse.json(
          {
            success: false,
            error: "INCOMPLETE_FLYER_DATA",
            message:
              extractedData.message ||
              "The flyer is missing required information. Please ensure the flyer includes: event name, date, time, venue name, city, and state.",
            partialData: partialData,
            suggestion: isSaveTheDate
              ? "Save the Date flyer is missing event name or date."
              : "This may be a Save the Date flyer. Consider adding missing information manually, or upload a complete event flyer with all details.",
          },
          { status: 400 }
        );
      }

      // Validate required fields are present
      // Description is ALWAYS required (contains all text from flyer)
      // For Save the Date flyers, only require description, name and date
      // Check multiple ways to detect Save the Date flyers
      const isSaveTheDate =
        extractedData.containsSaveTheDateText === true ||
        extractedData.eventType === "SAVE_THE_DATE" ||
        (extractedData.description &&
          extractedData.description.toLowerCase().includes("save the date")) ||
        (extractedData.description &&
          extractedData.description.toLowerCase().includes("details to follow"));

      const requiredFields = isSaveTheDate
        ? ["description", "eventName", "eventDate"]
        : ["description", "eventName", "eventDate", "eventTime", "venueName", "city", "state"];
      const missingFields = requiredFields.filter((field) => !extractedData[field]);

      if (missingFields.length > 0) {
        console.error("⚠️ MISSING REQUIRED FIELDS:", missingFields);
        console.error("Extracted data:", extractedData);

        // Special emphasis on date being missing (especially for Save the Date)
        if (missingFields.includes("eventDate")) {
          console.error("🚨 CRITICAL: DATE IS MISSING from extraction!");
          if (isSaveTheDate) {
            console.error(
              "🚨 THIS IS A SAVE THE DATE FLYER - THE DATE IS THE MOST IMPORTANT FIELD!"
            );
            console.error(
              "The AI MUST search the ENTIRE flyer for the date. Look everywhere: top, bottom, center, corners, watermarks, fine print."
            );
            throw new Error(
              `❌ SAVE THE DATE FLYER MISSING DATE: This is unacceptable. The DATE is the PRIMARY purpose of a Save the Date flyer. AI must search the entire image more carefully.`
            );
          } else {
            console.error("The AI must search the entire flyer for date/time information.");
            throw new Error(
              `❌ MANDATORY FIELD MISSING: eventDate. The date is REQUIRED - extraction cannot proceed without it.`
            );
          }
        }

        // Check for missing time (only required for non-Save the Date events)
        if (missingFields.includes("eventTime") && !isSaveTheDate) {
          console.error("🚨 CRITICAL: Time is MISSING from extraction!");
          console.error(
            "This is MANDATORY information for regular events. The AI must search the entire flyer for time."
          );
          throw new Error(
            `❌ MANDATORY FIELD MISSING: eventTime. Time is REQUIRED for regular events.`
          );
        }

        throw new Error(`AI failed to extract required fields: ${missingFields.join(", ")}`);
      }

      if (isSaveTheDate) {
      } else {
      }
    } catch (parseError) {
      console.error("❌ FAILED TO PARSE GEMINI RESPONSE");
      console.error(
        "Parse error:",
        parseError instanceof Error ? parseError.message : String(parseError)
      );
      console.error("Raw response (first 1000 chars):", cleanedText.substring(0, 1000));
      console.error(
        "Raw response (last 1000 chars):",
        cleanedText.substring(Math.max(0, cleanedText.length - 1000))
      );

      // Check for common JSON formatting issues
      if (cleanedText.includes("\n") && !cleanedText.includes("\\n")) {
        console.error("🚨 DETECTED: AI used actual newlines instead of \\n escape sequences");
        console.error("This is the most common cause of JSON parsing failures");
      }

      // Log character positions around the error if available
      if (parseError instanceof Error && parseError.message.includes("position")) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          const start = Math.max(0, pos - 100);
          const end = Math.min(cleanedText.length, pos + 100);
          console.error(`Context around error position ${pos}:`, cleanedText.substring(start, end));
        }
      }

      throw new Error("Failed to parse AI response as JSON - see server logs for details");
    }

    return NextResponse.json({
      success: true,
      extractedData,
      provider: "ollama-llama3.2-vision",
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
