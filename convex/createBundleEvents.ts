import { mutation } from "./_generated/server";

export const createBundleEvents = mutation({
  args: {},
  handler: async (ctx) => {
    // Get admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    const events = [];

    // ========== TWO-DAY EVENT 1 ==========
    const event1 = await ctx.db.insert("events", {
      name: "Weekend Steppers Fest 2025",
      description:
        "Join us for an incredible 2-day stepping extravaganza featuring live performances, workshops, and non-stop dancing! Experience Friday night's kick-off party and Saturday's grand finale.",
      eventType: "TICKETED_EVENT",
      startDate: new Date("2025-03-14T19:00:00").getTime(),
      endDate: new Date("2025-03-15T23:00:00").getTime(),
      location: {
        venueName: "Chicago Stepping Convention Center",
        address: "123 Step Boulevard",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA",
      },
      organizerId: adminUser._id,
      status: "PUBLISHED",
      categories: ["Stepping", "Dance", "Workshop"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Day-specific tickets for Event 1
    const tier1_day1 = await ctx.db.insert("ticketTiers", {
      eventId: event1,
      name: "Friday Only Access",
      description: "Access to Friday night kick-off party and performances",
      price: 4000, // $40
      quantity: 200,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier1_day2 = await ctx.db.insert("ticketTiers", {
      eventId: event1,
      name: "Saturday Only Access",
      description: "Access to Saturday workshops and grand finale",
      price: 4500, // $45
      quantity: 200,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Bundle for Event 1
    const bundle1 = await ctx.db.insert("ticketBundles", {
      eventId: event1,
      bundleType: "SINGLE_EVENT",
      name: "Full Weekend Pass",
      description: "Get access to both Friday and Saturday at a discounted rate!",
      price: 7500, // $75 (save $10)
      regularPrice: 8500, // $85 regular
      totalQuantity: 50,
      sold: 0,
      isActive: true,
      includedTiers: [
        { tierId: tier1_day1, tierName: "Friday Only Access", quantity: 1 },
        { tierId: tier1_day2, tierName: "Saturday Only Access", quantity: 1 },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    events.push({ eventId: event1, bundleId: bundle1 });

    // ========== TWO-DAY EVENT 2 ==========
    const event2 = await ctx.db.insert("events", {
      name: "Spring Step Showcase 2025",
      description:
        "Two days of elite stepping competitions, live music, and social dancing. Saturday features the preliminaries and Sunday showcases the championship finals!",
      eventType: "TICKETED_EVENT",
      startDate: new Date("2025-04-19T18:00:00").getTime(),
      endDate: new Date("2025-04-20T22:00:00").getTime(),
      location: {
        venueName: "Detroit Ballroom Center",
        address: "456 Dance Avenue",
        city: "Detroit",
        state: "MI",
        zipCode: "48201",
        country: "USA",
      },
      organizerId: adminUser._id,
      status: "PUBLISHED",
      categories: ["Stepping", "Competition", "Social"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier2_day1 = await ctx.db.insert("ticketTiers", {
      eventId: event2,
      name: "Saturday Only - Preliminaries",
      description: "Watch all preliminary rounds on Saturday",
      price: 3500, // $35
      quantity: 150,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier2_day2 = await ctx.db.insert("ticketTiers", {
      eventId: event2,
      name: "Sunday Only - Finals",
      description: "Championship finals and awards ceremony",
      price: 5000, // $50
      quantity: 150,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const bundle2 = await ctx.db.insert("ticketBundles", {
      eventId: event2,
      bundleType: "SINGLE_EVENT",
      name: "2-Day Competition Pass",
      description: "Experience both days of competition from prelims to finals!",
      price: 7500, // $75 (save $10)
      regularPrice: 8500, // $85 regular
      totalQuantity: 40,
      sold: 0,
      isActive: true,
      includedTiers: [
        { tierId: tier2_day1, tierName: "Saturday Only - Preliminaries", quantity: 1 },
        { tierId: tier2_day2, tierName: "Sunday Only - Finals", quantity: 1 },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    events.push({ eventId: event2, bundleId: bundle2 });

    // ========== THREE-DAY EVENT 1 ==========
    const event3 = await ctx.db.insert("events", {
      name: "Memorial Day Step Celebration 2025",
      description:
        "3-day Memorial Day weekend celebration featuring the nation's top steppers! Friday kick-off, Saturday workshops, and Sunday grand finale with live performances!",
      eventType: "TICKETED_EVENT",
      startDate: new Date("2025-05-23T17:00:00").getTime(),
      endDate: new Date("2025-05-25T23:59:00").getTime(),
      location: {
        venueName: "Atlanta Convention Hall",
        address: "789 Peachtree Street",
        city: "Atlanta",
        state: "GA",
        zipCode: "30303",
        country: "USA",
      },
      organizerId: adminUser._id,
      status: "PUBLISHED",
      categories: ["Stepping", "Festival", "Holiday"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier3_day1 = await ctx.db.insert("ticketTiers", {
      eventId: event3,
      name: "Friday Only Access",
      description: "Memorial Day weekend kick-off party",
      price: 4000, // $40
      quantity: 200,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier3_day2 = await ctx.db.insert("ticketTiers", {
      eventId: event3,
      name: "Saturday Only Access",
      description: "Full day of workshops and social dancing",
      price: 5000, // $50
      quantity: 200,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier3_day3 = await ctx.db.insert("ticketTiers", {
      eventId: event3,
      name: "Sunday Only Access",
      description: "Grand finale with live performances",
      price: 5500, // $55
      quantity: 200,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const bundle3 = await ctx.db.insert("ticketBundles", {
      eventId: event3,
      bundleType: "SINGLE_EVENT",
      name: "Full 3-Day Memorial Pass",
      description: "Complete weekend access - all 3 days at the best price!",
      price: 13000, // $130 (save $15)
      regularPrice: 14500, // $145 regular
      totalQuantity: 60,
      sold: 0,
      isActive: true,
      includedTiers: [
        { tierId: tier3_day1, tierName: "Friday Only Access", quantity: 1 },
        { tierId: tier3_day2, tierName: "Saturday Only Access", quantity: 1 },
        { tierId: tier3_day3, tierName: "Sunday Only Access", quantity: 1 },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    events.push({ eventId: event3, bundleId: bundle3 });

    // ========== THREE-DAY EVENT 2 ==========
    const event4 = await ctx.db.insert("events", {
      name: "Summer Step Summit 2025",
      description:
        "The ultimate 3-day stepping experience! Master classes by day, competitions and showcases by night. Friday opening ceremony, Saturday intensive workshops, Sunday championship finals!",
      eventType: "TICKETED_EVENT",
      startDate: new Date("2025-06-13T16:00:00").getTime(),
      endDate: new Date("2025-06-15T23:59:00").getTime(),
      location: {
        venueName: "Las Vegas Dance Arena",
        address: "321 Strip Boulevard",
        city: "Las Vegas",
        state: "NV",
        zipCode: "89109",
        country: "USA",
      },
      organizerId: adminUser._id,
      status: "PUBLISHED",
      categories: ["Stepping", "Workshop", "Competition"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier4_day1 = await ctx.db.insert("ticketTiers", {
      eventId: event4,
      name: "Friday Only - Opening Ceremony",
      description: "Opening ceremony and welcome party",
      price: 4500, // $45
      quantity: 250,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier4_day2 = await ctx.db.insert("ticketTiers", {
      eventId: event4,
      name: "Saturday Only - Master Classes",
      description: "Intensive workshops with top instructors",
      price: 6000, // $60
      quantity: 250,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const tier4_day3 = await ctx.db.insert("ticketTiers", {
      eventId: event4,
      name: "Sunday Only - Championship Finals",
      description: "Championship competitions and closing gala",
      price: 6500, // $65
      quantity: 250,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const bundle4 = await ctx.db.insert("ticketBundles", {
      eventId: event4,
      bundleType: "SINGLE_EVENT",
      name: "Full Summit Pass - 3 Days",
      description: "VIP access to all 3 days of the summit - the best value!",
      price: 15000, // $150 (save $20)
      regularPrice: 17000, // $170 regular
      totalQuantity: 75,
      sold: 0,
      isActive: true,
      includedTiers: [
        { tierId: tier4_day1, tierName: "Friday Only - Opening Ceremony", quantity: 1 },
        { tierId: tier4_day2, tierName: "Saturday Only - Master Classes", quantity: 1 },
        { tierId: tier4_day3, tierName: "Sunday Only - Championship Finals", quantity: 1 },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    events.push({ eventId: event4, bundleId: bundle4 });

    return {
      success: true,
      message: `Created 4 events with day-specific tickets and bundles`,
      events: events,
    };
  },
});
