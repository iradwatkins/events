import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * End-to-end test for 4-digit activation flow
 * Tests the complete workflow from cash sale to ticket activation
 */
export const testActivationFlow = mutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    steps: any[];
    error?: string;
  }> => {

    const steps = [];

    try {
      // ========================================
      // STEP 1: Find or create test staff member
      // ========================================

      // Find a test event with ticket tiers
      const allEvents = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("eventType"), "TICKETED_EVENT"))
        .collect();

      if (allEvents.length === 0) {
        throw new Error("No events found for testing");
      }

      // Find an event that has ticket tiers
      let testEvent;
      let testTier;

      for (const event of allEvents) {
        const tiers = await ctx.db
          .query("ticketTiers")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(1);

        if (tiers.length > 0) {
          testEvent = event;
          testTier = tiers[0];
          break;
        }
      }

      if (!testEvent || !testTier) {
        throw new Error("No events with ticket tiers found");
      }


      // Find or create staff member
      let staffMember = await ctx.db
        .query("eventStaff")
        .filter((q) => q.eq(q.field("eventId"), testEvent._id))
        .first();

      if (!staffMember) {
        // Get test user
        const testUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
          .first();

        if (!testUser) {
          throw new Error("Test user not found");
        }

        // Create staff member
        const staffId = await ctx.db.insert("eventStaff", {
          eventId: testEvent._id,
          organizerId: testUser._id,
          staffUserId: testUser._id,
          email: "iradwatkins@gmail.com",
          name: "Test Staff",
          role: "TEAM_MEMBERS",
          commissionType: "PERCENTAGE",
          commissionValue: 10,
          commissionPercent: 10,
          commissionEarned: 0,
          cashCollected: 0,
          isActive: true,
          ticketsSold: 0,
          referralCode: "TEST123",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        staffMember = await ctx.db.get(staffId);
      } else {
      }

      steps.push({
        step: 1,
        status: "PASSED",
        description: "Found test staff member and event",
      });

      // ========================================
      // STEP 2: Create cash sale with activation codes
      // ========================================

      const saleResult = await ctx.runMutation(api.staff.mutations.createCashSale, {
        staffId: staffMember!._id,
        eventId: testEvent._id,
        ticketTierId: testTier._id,
        quantity: 2,
        buyerName: "Test Customer",
        buyerEmail: "customer@example.com",
        paymentMethod: "CASH",
      });


      if (!saleResult.activationCodes || saleResult.activationCodes.length !== 2) {
        throw new Error("Expected 2 activation codes");
      }

      steps.push({
        step: 2,
        status: "PASSED",
        description: "Created cash sale with activation codes",
        activationCodes: saleResult.activationCodes,
      });

      // ========================================
      // STEP 3: Verify tickets are PENDING_ACTIVATION
      // ========================================

      const pendingTickets = await ctx.db
        .query("tickets")
        .filter((q) => q.eq(q.field("orderId"), saleResult.orderId as Id<"orders">))
        .collect();


      for (const ticket of pendingTickets) {

        if (ticket.status !== "PENDING_ACTIVATION") {
          throw new Error(`Expected PENDING_ACTIVATION, got ${ticket.status}`);
        }

        if (ticket.ticketCode) {
          throw new Error("Ticket should not have QR code before activation");
        }
      }

      steps.push({
        step: 3,
        status: "PASSED",
        description: "Verified tickets are pending activation",
        ticketCount: pendingTickets.length,
      });

      // ========================================
      // STEP 4: Activate first ticket
      // ========================================

      const firstActivationCode = saleResult.activationCodes[0];
      const customerEmail = "activated@example.com";

      const activationResult = await ctx.runMutation(api.tickets.mutations.activateTicket, {
        activationCode: firstActivationCode,
        customerEmail,
        customerName: "John Doe",
      });


      if (!activationResult.ticketCode) {
        throw new Error("Activation should have generated a ticket code");
      }

      steps.push({
        step: 4,
        status: "PASSED",
        description: "Successfully activated ticket",
        ticketCode: activationResult.ticketCode,
      });

      // ========================================
      // STEP 5: Verify ticket status updated
      // ========================================

      const activatedTicket = await ctx.db
        .query("tickets")
        .withIndex("by_ticket_code", (q) => q.eq("ticketCode", activationResult.ticketCode))
        .first();

      if (!activatedTicket) {
        throw new Error("Could not find activated ticket");
      }


      if (activatedTicket.status !== "VALID") {
        throw new Error(`Expected VALID status, got ${activatedTicket.status}`);
      }

      if (activatedTicket.attendeeEmail !== customerEmail) {
        throw new Error("Email was not updated");
      }

      if (!activatedTicket.activatedAt) {
        throw new Error("activatedAt timestamp not set");
      }

      steps.push({
        step: 5,
        status: "PASSED",
        description: "Verified ticket status and details updated",
      });

      // ========================================
      // STEP 6: Test duplicate activation
      // ========================================

      try {
        await ctx.runMutation(api.tickets.mutations.activateTicket, {
          activationCode: firstActivationCode,
          customerEmail: "another@example.com",
          customerName: "Jane Doe",
        });

        throw new Error("Should have prevented duplicate activation");
      } catch (error: any) {
        if (error.message.includes("already been activated")) {
          steps.push({
            step: 6,
            status: "PASSED",
            description: "Duplicate activation correctly prevented",
          });
        } else {
          throw error;
        }
      }

      // ========================================
      // STEP 7: Test invalid code
      // ========================================

      try {
        await ctx.runMutation(api.tickets.mutations.activateTicket, {
          activationCode: "9999",
          customerEmail: "test@example.com",
          customerName: "Test",
        });

        throw new Error("Should have rejected invalid code");
      } catch (error: any) {
        if (error.message.includes("Invalid activation code")) {
          steps.push({
            step: 7,
            status: "PASSED",
            description: "Invalid code correctly rejected",
          });
        } else {
          throw error;
        }
      }

      // ========================================
      // FINAL SUMMARY
      // ========================================

      const passedTests = steps.filter((s) => s.status === "PASSED").length;

      return {
        success: true,
        steps,
      };
    } catch (error: any) {
      steps.push({
        step: steps.length + 1,
        status: "FAILED",
        error: error.message,
      });

      return {
        success: false,
        steps,
        error: error.message,
      };
    }
  },
});
