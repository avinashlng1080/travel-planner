import { httpAction } from "./_generated/server";

/**
 * HTTP action to proxy Google Maps Distance Matrix API requests.
 * This is necessary because the Distance Matrix API doesn't support CORS,
 * so we can't call it directly from the browser.
 */
export const distanceMatrix = httpAction(async (_ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    // Parse query parameters from the request URL
    const url = new URL(request.url);
    const origins = url.searchParams.get("origins");
    const destinations = url.searchParams.get("destinations");
    const mode = url.searchParams.get("mode");
    const apiKey = url.searchParams.get("key");

    // Validate required parameters
    if (!origins || !destinations || !mode || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: origins, destinations, mode, key",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Build Google Maps Distance Matrix API URL
    const googleApiUrl = new URL(
      "https://maps.googleapis.com/maps/api/distancematrix/json"
    );
    googleApiUrl.searchParams.append("origins", origins);
    googleApiUrl.searchParams.append("destinations", destinations);
    googleApiUrl.searchParams.append("mode", mode.toLowerCase());
    googleApiUrl.searchParams.append("key", apiKey);

    // Make request to Google Maps API
    const response = await fetch(googleApiUrl.toString());

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the response with CORS headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Distance Matrix API proxy error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
