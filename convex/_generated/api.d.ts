/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chatMessages from "../chatMessages.js";
import type * as checklists from "../checklists.js";
import type * as claude from "../claude.js";
import type * as commuteDestinations from "../commuteDestinations.js";
import type * as dayPlans from "../dayPlans.js";
import type * as distanceMatrix from "../distanceMatrix.js";
import type * as http from "../http.js";
import type * as locations from "../locations.js";
import type * as parseItinerary from "../parseItinerary.js";
import type * as parseItineraryLocal from "../parseItineraryLocal.js";
import type * as pois from "../pois.js";
import type * as scheduleItems from "../scheduleItems.js";
import type * as seed from "../seed.js";
import type * as travelPlanCategories from "../travelPlanCategories.js";
import type * as tripActivity from "../tripActivity.js";
import type * as tripComments from "../tripComments.js";
import type * as tripLocations from "../tripLocations.js";
import type * as tripMembers from "../tripMembers.js";
import type * as tripPlans from "../tripPlans.js";
import type * as tripScheduleItems from "../tripScheduleItems.js";
import type * as trips from "../trips.js";
import type * as userProfiles from "../userProfiles.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chatMessages: typeof chatMessages;
  checklists: typeof checklists;
  claude: typeof claude;
  commuteDestinations: typeof commuteDestinations;
  dayPlans: typeof dayPlans;
  distanceMatrix: typeof distanceMatrix;
  http: typeof http;
  locations: typeof locations;
  parseItinerary: typeof parseItinerary;
  parseItineraryLocal: typeof parseItineraryLocal;
  pois: typeof pois;
  scheduleItems: typeof scheduleItems;
  seed: typeof seed;
  travelPlanCategories: typeof travelPlanCategories;
  tripActivity: typeof tripActivity;
  tripComments: typeof tripComments;
  tripLocations: typeof tripLocations;
  tripMembers: typeof tripMembers;
  tripPlans: typeof tripPlans;
  tripScheduleItems: typeof tripScheduleItems;
  trips: typeof trips;
  userProfiles: typeof userProfiles;
  weather: typeof weather;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
