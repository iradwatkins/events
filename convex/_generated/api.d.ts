/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addCredits from "../addCredits.js";
import type * as admin_queries from "../admin/queries.js";
import type * as admin_systemReset from "../admin/systemReset.js";
import type * as admin from "../admin.js";
import type * as adminPanel_actions from "../adminPanel/actions.js";
import type * as adminPanel_mutations from "../adminPanel/mutations.js";
import type * as adminPanel_queries from "../adminPanel/queries.js";
import type * as auth_mutations from "../auth/mutations.js";
import type * as auth_queries from "../auth/queries.js";
import type * as bundles_mutations from "../bundles/mutations.js";
import type * as bundles_queries from "../bundles/queries.js";
import type * as clearOldData from "../clearOldData.js";
import type * as createBundleEvents from "../createBundleEvents.js";
import type * as createMultiEventBundle from "../createMultiEventBundle.js";
import type * as createRealTestEvents from "../createRealTestEvents.js";
import type * as createTestBundles from "../createTestBundles.js";
import type * as credits_mutations from "../credits/mutations.js";
import type * as credits_queries from "../credits/queries.js";
import type * as crm_mutations from "../crm/mutations.js";
import type * as crm_queries from "../crm/queries.js";
import type * as debug from "../debug.js";
import type * as discounts_mutations from "../discounts/mutations.js";
import type * as discounts_queries from "../discounts/queries.js";
import type * as events_mutations from "../events/mutations.js";
import type * as events_queries from "../events/queries.js";
import type * as files_mutations from "../files/mutations.js";
import type * as files_queries from "../files/queries.js";
import type * as flyers_mutations from "../flyers/mutations.js";
import type * as flyers_queries from "../flyers/queries.js";
import type * as lib_timezone from "../lib/timezone.js";
import type * as migrations_updatePaymentModels from "../migrations/updatePaymentModels.js";
import type * as paymentConfig_mutations from "../paymentConfig/mutations.js";
import type * as paymentConfig_queries from "../paymentConfig/queries.js";
import type * as payments_actions from "../payments/actions.js";
import type * as payments_consignment from "../payments/consignment.js";
import type * as payments_mutations from "../payments/mutations.js";
import type * as payments_queries from "../payments/queries.js";
import type * as products_mutations from "../products/mutations.js";
import type * as products_orders from "../products/orders.js";
import type * as products_queries from "../products/queries.js";
import type * as public_queries from "../public/queries.js";
import type * as runLiveTicketTests from "../runLiveTicketTests.js";
import type * as scanning_mutations from "../scanning/mutations.js";
import type * as scanning_queries from "../scanning/queries.js";
import type * as seating_mutations from "../seating/mutations.js";
import type * as seating_queries from "../seating/queries.js";
import type * as seed from "../seed.js";
import type * as staff_mutations from "../staff/mutations.js";
import type * as staff_queries from "../staff/queries.js";
import type * as staff_settlement from "../staff/settlement.js";
import type * as staff_transfers from "../staff/transfers.js";
import type * as templates_mutations from "../templates/mutations.js";
import type * as templates_queries from "../templates/queries.js";
import type * as testActivationFlow from "../testActivationFlow.js";
import type * as testEvents from "../testEvents.js";
import type * as testMultiEventBundlePurchase from "../testMultiEventBundlePurchase.js";
import type * as testSeed from "../testSeed.js";
import type * as tickets_mutations from "../tickets/mutations.js";
import type * as tickets_queries from "../tickets/queries.js";
import type * as transfers_mutations from "../transfers/mutations.js";
import type * as transfers_queries from "../transfers/queries.js";
import type * as upload from "../upload.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as waitlist_mutations from "../waitlist/mutations.js";
import type * as waitlist_queries from "../waitlist/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addCredits: typeof addCredits;
  "admin/queries": typeof admin_queries;
  "admin/systemReset": typeof admin_systemReset;
  admin: typeof admin;
  "adminPanel/actions": typeof adminPanel_actions;
  "adminPanel/mutations": typeof adminPanel_mutations;
  "adminPanel/queries": typeof adminPanel_queries;
  "auth/mutations": typeof auth_mutations;
  "auth/queries": typeof auth_queries;
  "bundles/mutations": typeof bundles_mutations;
  "bundles/queries": typeof bundles_queries;
  clearOldData: typeof clearOldData;
  createBundleEvents: typeof createBundleEvents;
  createMultiEventBundle: typeof createMultiEventBundle;
  createRealTestEvents: typeof createRealTestEvents;
  createTestBundles: typeof createTestBundles;
  "credits/mutations": typeof credits_mutations;
  "credits/queries": typeof credits_queries;
  "crm/mutations": typeof crm_mutations;
  "crm/queries": typeof crm_queries;
  debug: typeof debug;
  "discounts/mutations": typeof discounts_mutations;
  "discounts/queries": typeof discounts_queries;
  "events/mutations": typeof events_mutations;
  "events/queries": typeof events_queries;
  "files/mutations": typeof files_mutations;
  "files/queries": typeof files_queries;
  "flyers/mutations": typeof flyers_mutations;
  "flyers/queries": typeof flyers_queries;
  "lib/timezone": typeof lib_timezone;
  "migrations/updatePaymentModels": typeof migrations_updatePaymentModels;
  "paymentConfig/mutations": typeof paymentConfig_mutations;
  "paymentConfig/queries": typeof paymentConfig_queries;
  "payments/actions": typeof payments_actions;
  "payments/consignment": typeof payments_consignment;
  "payments/mutations": typeof payments_mutations;
  "payments/queries": typeof payments_queries;
  "products/mutations": typeof products_mutations;
  "products/orders": typeof products_orders;
  "products/queries": typeof products_queries;
  "public/queries": typeof public_queries;
  runLiveTicketTests: typeof runLiveTicketTests;
  "scanning/mutations": typeof scanning_mutations;
  "scanning/queries": typeof scanning_queries;
  "seating/mutations": typeof seating_mutations;
  "seating/queries": typeof seating_queries;
  seed: typeof seed;
  "staff/mutations": typeof staff_mutations;
  "staff/queries": typeof staff_queries;
  "staff/settlement": typeof staff_settlement;
  "staff/transfers": typeof staff_transfers;
  "templates/mutations": typeof templates_mutations;
  "templates/queries": typeof templates_queries;
  testActivationFlow: typeof testActivationFlow;
  testEvents: typeof testEvents;
  testMultiEventBundlePurchase: typeof testMultiEventBundlePurchase;
  testSeed: typeof testSeed;
  "tickets/mutations": typeof tickets_mutations;
  "tickets/queries": typeof tickets_queries;
  "transfers/mutations": typeof transfers_mutations;
  "transfers/queries": typeof transfers_queries;
  upload: typeof upload;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "waitlist/mutations": typeof waitlist_mutations;
  "waitlist/queries": typeof waitlist_queries;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
