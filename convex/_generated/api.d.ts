/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as clearOldData from "../clearOldData.js";
import type * as credits_mutations from "../credits/mutations.js";
import type * as credits_queries from "../credits/queries.js";
import type * as debug from "../debug.js";
import type * as events_mutations from "../events/mutations.js";
import type * as events_queries from "../events/queries.js";
import type * as files_mutations from "../files/mutations.js";
import type * as files_queries from "../files/queries.js";
import type * as paymentConfig_mutations from "../paymentConfig/mutations.js";
import type * as paymentConfig_queries from "../paymentConfig/queries.js";
import type * as payments_mutations from "../payments/mutations.js";
import type * as payments_queries from "../payments/queries.js";
import type * as public_queries from "../public/queries.js";
import type * as seed from "../seed.js";
import type * as staff_mutations from "../staff/mutations.js";
import type * as staff_queries from "../staff/queries.js";
import type * as tickets_mutations from "../tickets/mutations.js";
import type * as tickets_queries from "../tickets/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

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
  admin: typeof admin;
  clearOldData: typeof clearOldData;
  "credits/mutations": typeof credits_mutations;
  "credits/queries": typeof credits_queries;
  debug: typeof debug;
  "events/mutations": typeof events_mutations;
  "events/queries": typeof events_queries;
  "files/mutations": typeof files_mutations;
  "files/queries": typeof files_queries;
  "paymentConfig/mutations": typeof paymentConfig_mutations;
  "paymentConfig/queries": typeof paymentConfig_queries;
  "payments/mutations": typeof payments_mutations;
  "payments/queries": typeof payments_queries;
  "public/queries": typeof public_queries;
  seed: typeof seed;
  "staff/mutations": typeof staff_mutations;
  "staff/queries": typeof staff_queries;
  "tickets/mutations": typeof tickets_mutations;
  "tickets/queries": typeof tickets_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
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
