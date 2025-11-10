import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const EVENT_ID = 'jh75kydzxb2xb1jj2rwnq1q8f97tvqfa';

async function listStaffMembers() {
  try {
    console.log('👥 Staff Hierarchy for Test Event');
    console.log('===================================\n');

    // Get all staff for the event
    const allStaff = await client.query(api.staff.queries.getEventStaff, {
      eventId: EVENT_ID
    });

    console.log(`Total Staff Members: ${allStaff.length}\n`);

    // Organize by hierarchy level
    const level1 = allStaff.filter(s => s.hierarchyLevel === 1);
    const level2 = allStaff.filter(s => s.hierarchyLevel === 2);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STAFF SUPPORT (Level 1 - Can Assign Sub-Sellers)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    level1.forEach((staff, idx) => {
      const subSellers = level2.filter(s => s.assignedByStaffId === staff._id);
      const canScanText = staff.canScan ? 'Can SCAN + SELL' : 'Can SELL ONLY';

      console.log(`${idx + 1}. ${staff.name}`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Phone: ${staff.phone}`);
      console.log(`   Role: ${staff.role}`);
      console.log(`   Permissions: ${canScanText}`);
      console.log(`   Allocated Tickets: ${staff.allocatedTickets}`);
      console.log(`   Commission: $${(staff.commissionValue / 100).toFixed(2)} per ticket`);
      console.log(`   Referral Code: ${staff.referralCode}`);
      console.log(`   Referral Link: https://events.stepperslife.com/events/${EVENT_ID}/checkout?ref=${staff.referralCode}`);
      console.log(`   Sub-Sellers: ${subSellers.length}`);

      if (subSellers.length > 0) {
        console.log(`   └─ Sub-Sellers:`);
        subSellers.forEach((sub, subIdx) => {
          console.log(`      ${subIdx + 1}. ${sub.name}: ${sub.allocatedTickets} tickets, $${(sub.commissionValue / 100).toFixed(2)} commission`);
          console.log(`         Referral Code: ${sub.referralCode}`);
          console.log(`         Referral Link: https://events.stepperslife.com/events/${EVENT_ID}/checkout?ref=${sub.referralCode}`);
        });
      }
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('REGULAR STAFF (Cannot Assign Sub-Sellers)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const regularStaff = allStaff.filter(s =>
      s.hierarchyLevel === 1 &&
      !s.canAssignSubSellers &&
      s.role !== 'SCANNER'
    );

    const scanners = allStaff.filter(s => s.role === 'SCANNER');

    regularStaff.forEach((staff, idx) => {
      console.log(`${idx + 1}. ${staff.name}`);
      console.log(`   Role: SELLER + SCANNER`);
      console.log(`   Allocated Tickets: ${staff.allocatedTickets}`);
      console.log(`   Commission: $${(staff.commissionValue / 100).toFixed(2)} per ticket`);
      console.log(`   Referral Code: ${staff.referralCode}`);
      console.log(`   Referral Link: https://events.stepperslife.com/events/${EVENT_ID}/checkout?ref=${staff.referralCode}`);
      console.log('');
    });

    scanners.forEach((staff, idx) => {
      console.log(`${regularStaff.length + idx + 1}. ${staff.name}`);
      console.log(`   Role: SCANNER ONLY (Cannot Sell)`);
      console.log(`   Allocated Tickets: ${staff.allocatedTickets}`);
      console.log(`   Referral Code: N/A (scanners don't sell)`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total People: ${allStaff.length}`);
    console.log(`  • Staff Support (can assign): ${level1.filter(s => s.canAssignSubSellers).length}`);
    console.log(`  • Sub-Resellers: ${level2.length}`);
    console.log(`  • Regular Staff (sellers): ${regularStaff.length}`);
    console.log(`  • Scanners Only: ${scanners.length}`);
    console.log('');

    const totalAllocated = allStaff.reduce((sum, s) => sum + (s.allocatedTickets || 0), 0);
    console.log(`Total Tickets Allocated to Staff: ${totalAllocated}`);
    console.log(`Organizer Keeps: ${5000 - totalAllocated}`);

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

listStaffMembers();
