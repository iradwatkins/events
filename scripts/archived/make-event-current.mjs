import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");
const EVENT_ID = "jh72wsebqa27cb8zzqw2bqvxan7v639n";

async function makeEventCurrent() {
  console.log("📅 Making event CURRENT (today's date)...\n");

  try {
    // Get the event first
    const event = await client.query(api.events.queries.getEventById, {
      eventId: EVENT_ID
    });

    console.log(`Current Event: ${event.name}`);
    console.log(`Current Date: ${event.eventDateLiteral}`);

    // Set to today's date - event starts at 8 PM tonight, ends at 2 AM tomorrow
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Event starts today at 8 PM
    const eventStart = new Date(today);
    eventStart.setHours(20, 0, 0, 0); // 8:00 PM

    // Event ends tomorrow at 2 AM
    const eventEnd = new Date(today);
    eventEnd.setDate(eventEnd.getDate() + 1);
    eventEnd.setHours(2, 0, 0, 0); // 2:00 AM next day

    const dateString = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`\nNew Event Date: ${dateString}`);
    console.log(`Start: ${eventStart.toLocaleString()}`);
    console.log(`End: ${eventEnd.toLocaleString()}`);

    // Create an internal mutation to update the event
    // Since we don't have one, let's use a workaround with updateEvent if it exists

    console.log("\n⚠️  Need to update event dates manually in Convex");
    console.log("\nRun this command:");
    console.log(`npx convex run events/mutations:updateEvent '{"eventId":"${EVENT_ID}","startDate":${eventStart.getTime()},"endDate":${eventEnd.getTime()},"eventDateLiteral":"${dateString}","eventTimeLiteral":"8:00 PM - 2:00 AM"}'`);

    // Also update early bird dates to be active NOW
    const publicEvent = await client.query(api.public.queries.getPublicEventDetails, {
      eventId: EVENT_ID
    });

    console.log("\n🎫 Ticket Tiers with Early Bird Pricing:");
    if (publicEvent.ticketTiers) {
      publicEvent.ticketTiers.forEach((tier, index) => {
        if (tier.pricingTiers && tier.pricingTiers.length > 0) {
          console.log(`\n${index + 1}. ${tier.name}:`);
          console.log(`   Tier ID: ${tier._id}`);
          console.log(`   Early bird pricing needs to be updated to current dates`);
        }
      });
    }

    console.log("\n✅ Event can be viewed live at:");
    console.log(`   https://events.stepperslife.com/events/${EVENT_ID}`);

    console.log("\n💳 Payment Method: CASH (PREPAY model)");
    console.log("   Organizer accepts cash payments only");
    console.log("   No online payment processing");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

makeEventCurrent()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
