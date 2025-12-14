import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { chat } from "./claude";

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

export default http;
