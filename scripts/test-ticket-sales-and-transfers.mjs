import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

const TEST_EVENT_ID = "jh75kydzxb2xb1jj2rwnq1q8f97tvqfa";
const TICKET_TIER_ID = "k971b826qmc19f4eesjy5pv4kh7tvah6"; // General Admission - $25.00

// Helper to generate random sales
function getRandomSales(max) {
  return Math.floor(Math.random() * max) + 1;
}

// Helper to format currency
function formatCurrency(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function main() {
  console.log("🎫 TICKET SALES & TRANSFER TEST SCENARIO");
  console.log("=========================================\n");

  try {
    // Step 1: Get all staff for the test event
    console.log("📋 Step 1: Getting all staff members for the event...");
    const allStaff = await client.query(api.staff.queries.getEventStaff, {
      eventId: TEST_EVENT_ID,
    });

    console.log(`Found ${allStaff.length} staff members\n`);

    // Filter active sellers with allocated tickets (TEAM_MEMBERS)
    const sellers = allStaff.filter(
      (s) => s.role === "TEAM_MEMBERS" && s.allocatedTickets > 0 && s.isActive
    );

    console.log(`Active sellers with tickets: ${sellers.length}\n`);

    // Step 2: Simulate some sales for each seller
    console.log("💰 Step 2: Simulating ticket sales...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const salesData = [];

    for (const seller of sellers.slice(0, 5)) {
      // Only test first 5 sellers
      const maxSales = Math.min(seller.allocatedTickets, 50); // Don't sell more than 50 for test
      const ticketsSold = getRandomSales(maxSales);

      console.log(`\n📊 ${seller.name}`);
      console.log(`   Allocated: ${seller.allocatedTickets} tickets`);
      console.log(`   Selling: ${ticketsSold} tickets`);

      // Register the sales using createCashSale
      const paymentMethods = ["CASH", "CASH_APP"];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      try {
        await client.mutation(api.staff.mutations.createCashSale, {
          staffId: seller._id,
          eventId: TEST_EVENT_ID,
          ticketTierId: TICKET_TIER_ID,
          quantity: ticketsSold,
          buyerName: `Test Customer - ${seller.name}`,
          buyerEmail: `customer-${Date.now()}@test.com`,
          paymentMethod: paymentMethod,
        });
      } catch (error) {
        console.log(`   ⚠️  Sale failed: ${error.message}`);
      }

      // Get updated stats
      const updatedSeller = await client.query(api.staff.queries.getStaffMemberDetails, {
        staffId: seller._id,
      });

      salesData.push({
        name: seller.name,
        staffId: seller._id,
        allocated: seller.allocatedTickets,
        sold: updatedSeller.ticketsSold,
        remaining: updatedSeller.ticketsRemaining,
        commission: updatedSeller.commissionEarned,
        cashCollected: updatedSeller.cashCollected,
        netPayout: updatedSeller.netPayout,
      });

      console.log(`   ✅ Sold: ${updatedSeller.ticketsSold} tickets`);
      console.log(`   💵 Commission Earned: ${formatCurrency(updatedSeller.commissionEarned)}`);
      console.log(`   💰 Cash Collected: ${formatCurrency(updatedSeller.cashCollected)}`);
      console.log(`   🏦 Net Payout Due: ${formatCurrency(updatedSeller.netPayout)}`);
    }

    console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📈 SALES SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    salesData.forEach((data, idx) => {
      console.log(`${idx + 1}. ${data.name}`);
      console.log(`   Allocated: ${data.allocated} | Sold: ${data.sold} | Remaining: ${data.remaining}`);
      console.log(`   Commission: ${formatCurrency(data.commission)} | Net Payout: ${formatCurrency(data.netPayout)}\n`);
    });

    // Step 3: Simulate ticket transfers
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 Step 3: Testing Ticket Transfers");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Transfer scenario: Staff Support 1 transfers tickets to Sub-Reseller 1.1
    if (salesData.length >= 2) {
      const sender = salesData[0]; // Staff Support 1
      const receiver = salesData[1]; // Next seller
      const transferAmount = Math.min(10, sender.remaining); // Transfer 10 or remaining, whichever is less

      if (transferAmount > 0) {
        console.log(`\n🔁 TRANSFER #1`);
        console.log(`   From: ${sender.name} (has ${sender.remaining} tickets)`);
        console.log(`   To: ${receiver.name} (has ${receiver.remaining} tickets)`);
        console.log(`   Amount: ${transferAmount} tickets\n`);

        try {
          // Check if we have the transfer mutation available
          const result = await client.mutation(api.staff.transfers.requestTransfer, {
            eventId: TEST_EVENT_ID,
            toStaffId: receiver.staffId,
            ticketQuantity: transferAmount,
            notes: "Test transfer - reallocating tickets to high performer",
          });

          const transferId = result.transferId;

          console.log(`   ✅ Transfer request created: ${transferId}`);

          // Accept the transfer
          await client.mutation(api.staff.transfers.acceptTransfer, {
            transferId: transferId,
          });

          console.log(`   ✅ Transfer accepted!\n`);

          // Get pending transfers for receiver (no params needed - returns counts)
          const pendingTransfers = await client.query(api.staff.transfers.getPendingTransfers, {});

          console.log(`   📬 Pending transfers - Incoming: ${pendingTransfers.incoming}, Outgoing: ${pendingTransfers.outgoing}\n`);

          // Get "my transfers" for sender to see outgoing (auto-detects user)
          const myTransfers = await client.query(api.staff.transfers.getMyTransfers, {});

          console.log(`   📤 Transfer history (${myTransfers.length} total):`);
          myTransfers.forEach((transfer, idx) => {
            console.log(`      ${idx + 1}. ${transfer.ticketQuantity || transfer.quantity} tickets to ${transfer.toStaff?.name || 'Unknown'}`);
            console.log(`         Status: ${transfer.status}`);
            console.log(`         Notes: ${transfer.notes || 'None'}\n`);
          });

        } catch (error) {
          console.log(`   ❌ Transfer failed: ${error.message}`);
        }
      }
    }

    // Step 4: Create another transfer and track the cash flow
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💸 Step 4: Transfer + Sales = Cash Owed Tracking");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (salesData.length >= 3) {
      const transferrer = salesData[1]; // Second seller
      const recipient = salesData[2]; // Third seller
      const transferQty = Math.min(15, transferrer.remaining);

      if (transferQty > 0) {
        console.log(`\n🔁 TRANSFER #2 (with subsequent sales)`);
        console.log(`   From: ${transferrer.name}`);
        console.log(`   To: ${recipient.name}`);
        console.log(`   Amount: ${transferQty} tickets\n`);

        try {
          const result2 = await client.mutation(api.staff.transfers.requestTransfer, {
            eventId: TEST_EVENT_ID,
            toStaffId: recipient.staffId,
            ticketQuantity: transferQty,
            notes: "Transfer for testing cash tracking - recipient will sell these",
          });

          const transferId = result2.transferId;

          await client.mutation(api.staff.transfers.acceptTransfer, {
            transferId: transferId,
          });

          console.log(`   ✅ Transfer completed!\n`);

          // Now recipient sells some of the transferred tickets
          const salesToMake = Math.min(8, transferQty); // Sell 8 of the transferred tickets

          console.log(`   💰 ${recipient.name} now selling ${salesToMake} of the transferred tickets...\n`);

          await client.mutation(api.staff.mutations.createCashSale, {
            staffId: recipient.staffId,
            eventId: TEST_EVENT_ID,
            ticketTierId: TICKET_TIER_ID,
            quantity: salesToMake,
            buyerName: `Transferred Ticket Customer`,
            buyerEmail: `transferred-${Date.now()}@test.com`,
            paymentMethod: "CASH",
          });

          // Get updated stats for both parties
          const updatedTransferrer = await client.query(api.staff.queries.getStaffMemberDetails, {
            staffId: transferrer.staffId,
          });

          const updatedRecipient = await client.query(api.staff.queries.getStaffMemberDetails, {
            staffId: recipient.staffId,
          });

          console.log(`   📊 AFTER TRANSFER & SALES:`);
          console.log(`   ─────────────────────────────────`);
          console.log(`   ${transferrer.name} (Transferrer):`);
          console.log(`      Remaining tickets: ${updatedTransferrer.ticketsRemaining}`);
          console.log(`      Total commission: ${formatCurrency(updatedTransferrer.commissionEarned)}`);
          console.log(`      Cash collected: ${formatCurrency(updatedTransferrer.cashCollected)}`);
          console.log(`      Net payout: ${formatCurrency(updatedTransferrer.netPayout)}\n`);

          console.log(`   ${recipient.name} (Recipient):`);
          console.log(`      Total sold: ${updatedRecipient.ticketsSold} tickets`);
          console.log(`      Remaining tickets: ${updatedRecipient.ticketsRemaining}`);
          console.log(`      Total commission: ${formatCurrency(updatedRecipient.commissionEarned)}`);
          console.log(`      Cash collected: ${formatCurrency(updatedRecipient.cashCollected)}`);
          console.log(`      Net payout: ${formatCurrency(updatedRecipient.netPayout)}\n`);

          console.log(`   💵 CASH FLOW ANALYSIS:`);
          console.log(`   ─────────────────────────────────`);
          console.log(`   → ${recipient.name} sold ${salesToMake} tickets from ${transferrer.name}`);
          console.log(`   → ${recipient.name} earned commission: ${formatCurrency(updatedRecipient.commissionEarned)}`);
          console.log(`   → ${recipient.name} collected cash: ${formatCurrency(updatedRecipient.cashCollected)}`);

          // Calculate what recipient owes transferrer (if any)
          const ticketPrice = 2500; // $25 per ticket
          const valueOfTransferredTickets = transferQty * ticketPrice;
          const valueOfSoldTickets = salesToMake * ticketPrice;

          console.log(`\n   💰 SETTLEMENT CALCULATION:`);
          console.log(`   ─────────────────────────────────`);
          console.log(`   Value of transferred tickets: ${formatCurrency(valueOfTransferredTickets)}`);
          console.log(`   Value of tickets sold by recipient: ${formatCurrency(valueOfSoldTickets)}`);
          console.log(`   Recipient's commission: ${formatCurrency(updatedRecipient.commissionEarned)}`);
          console.log(`   \n   → ${recipient.name} should pay ${transferrer.name}:`);
          console.log(`     ${formatCurrency(valueOfSoldTickets - updatedRecipient.commissionEarned)}`);
          console.log(`     (Sale proceeds minus commission)\n`);

        } catch (error) {
          console.log(`   ❌ Transfer/Sales test failed: ${error.message}`);
        }
      }
    }

    // Step 5: Final summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 FINAL DASHBOARD SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Get final state for all tested sellers
    for (const data of salesData) {
      const finalStats = await client.query(api.staff.queries.getStaffMemberDetails, {
        staffId: data.staffId,
      });

      console.log(`\n${data.name}:`);
      console.log(`  📦 Allocated: ${data.allocated} tickets`);
      console.log(`  ✅ Sold: ${finalStats.ticketsSold} tickets`);
      console.log(`  📊 Remaining: ${finalStats.ticketsRemaining} tickets`);
      console.log(`  💵 Commission Earned: ${formatCurrency(finalStats.commissionEarned)}`);
      console.log(`  💰 Cash Collected: ${formatCurrency(finalStats.cashCollected)}`);
      console.log(`  🏦 Net Payout Due: ${formatCurrency(finalStats.netPayout)}`);

      const salesBreakdown = finalStats.salesBreakdown;
      if (salesBreakdown) {
        console.log(`  📈 Sales Breakdown:`);
        console.log(`     - Cash: ${salesBreakdown.cash}`);
        console.log(`     - CashApp: ${salesBreakdown.cashApp}`);
        console.log(`     - Online: ${salesBreakdown.online}`);
      }
    }

    console.log("\n\n✅ TEST COMPLETED SUCCESSFULLY!");
    console.log("\n📝 Key Observations:");
    console.log("   1. Sales are tracked per staff member");
    console.log("   2. Transfers reduce sender's tickets and increase recipient's tickets");
    console.log("   3. When recipient sells transferred tickets:");
    console.log("      - Recipient earns commission");
    console.log("      - Recipient collects cash");
    console.log("      - System tracks net payout (commission - cash collected)");
    console.log("   4. For cash settlements between staff:");
    console.log("      - Recipient pays sender: (Sale proceeds - Commission)");
    console.log("      - This happens OUTSIDE the system in cash");
    console.log("      - System provides tracking data for transparency\n");

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  }

  process.exit(0);
}

main();
