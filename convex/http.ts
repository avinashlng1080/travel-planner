import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { chat } from "./claude";
import { parseItinerary } from "./parseItinerary";
import { parseItineraryLocal } from "./parseItineraryLocal";

const http = httpRouter();

// Auth routes (required for Convex Auth)
auth.addHttpRoutes(http);

// Claude chat endpoint
http.route({
  path: "/chat",
  method: "POST",
  handler: chat,
});

// CORS preflight handler
http.route({
  path: "/chat",
  method: "OPTIONS",
  handler: chat,
});

// Parse itinerary endpoint
http.route({
  path: "/parseItinerary",
  method: "POST",
  handler: parseItinerary,
});

// CORS preflight handler for parse itinerary
http.route({
  path: "/parseItinerary",
  method: "OPTIONS",
  handler: parseItinerary,
});

// Local itinerary parser (no Claude, uses regex + geocoding)
http.route({
  path: "/parseItineraryLocal",
  method: "POST",
  handler: parseItineraryLocal,
});

http.route({
  path: "/parseItineraryLocal",
  method: "OPTIONS",
  handler: parseItineraryLocal,
});

export default http;
