/**
 * Cron Jobs for Automated Tasks
 *
 * Scheduled tasks that run periodically to maintain system state
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Expire Cash Orders
 * Runs every 5 minutes to check for and expire cash orders that have passed their 30-minute hold
 */
crons.interval(
  "expire-cash-orders",
  { minutes: 5 }, // Check every 5 minutes
  internal.orders.cashPaymentsCron.expireCashOrders
);

export default crons;
