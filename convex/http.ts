import { httpRouter } from "convex/server";
import { chat } from "./claude";

const http = httpRouter();

// Claude chat endpoint
http.route({
  path: "/chat",
  method: "POST",
  handler: chat,
});

export default http;
