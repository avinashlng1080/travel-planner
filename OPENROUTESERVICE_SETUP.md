# OpenRouteService Setup Guide

This guide explains how to set up OpenRouteService API for real road routing in the Malaysia Family Travel Planner.

## Why OpenRouteService?

The app uses **OpenRouteService** to display actual driving routes on the map instead of straight lines between locations. This provides:

- **Real road routes** that follow highways and streets (like Google Maps or Grab)
- **Distance and duration** calculations for each route segment
- **Free tier** with 2,000 requests per day (more than enough for travel planning)
- **Better accuracy** than OSRM in many regions, especially Southeast Asia

## Getting Your Free API Key

### Step 1: Sign Up

1. Go to https://openrouteservice.org/
2. Click **"Sign Up"** in the top right corner
3. Create an account with your email address
4. Verify your email address

### Step 2: Get Your API Key

1. Log in to your OpenRouteService account
2. Go to **"Developer Dashboard"** or **"API Keys"**
3. Click **"Create Token"** or **"Request a Token"**
4. Give it a name (e.g., "Malaysia Travel Planner")
5. Copy your API key (looks like: `5b3ce3597851110001cf6248...`)

### Step 3: Add to Your Environment

Add the API key to your `.env.local` file:

```bash
VITE_ORS_API_KEY=5b3ce3597851110001cf6248your-actual-api-key-here
```

**Important:**
- Make sure to use `VITE_` prefix so Vite exposes it to the browser
- Never commit your API key to Git (`.env.local` is already in `.gitignore`)
- Keep your API key secret

## Usage Limits

**Free Tier:**
- 2,000 requests per day
- 40 requests per minute
- Routing for car, bike, pedestrian, wheelchair

**How the app uses it:**
- Each route between locations = 1 request
- Routes are cached, so switching between Plan A/B doesn't re-fetch
- Debounced by 300ms to avoid rapid-fire requests
- Falls back to straight lines if quota exceeded

## What Happens Without API Key?

If you don't set `VITE_ORS_API_KEY`, the app will:

1. **Still work perfectly** - no crashes or errors
2. **Display straight lines** between locations instead of road routes
3. **Log a warning** in the console with instructions to get a key
4. **Not calculate** distance/duration metrics

This graceful fallback ensures the app works even without the API key.

## Testing Your Setup

1. Start the dev server: `npm run dev`
2. Open the browser console (F12)
3. Select a day plan with multiple locations
4. Look for logs like:
   ```
   [RoutingLayer] Route loaded with 1234 points (15.3km, 25min)
   ```
5. If you see a warning about missing API key, check your `.env.local`

## Troubleshooting

### "No API key found" warning

**Problem:** You see: `Using straight line fallback (no API key or API error)`

**Solutions:**
- Make sure `.env.local` exists in the project root
- Verify the variable name is exactly `VITE_ORS_API_KEY`
- Restart the dev server after adding the key
- Check there are no quotes around the key value

### "API error 403" or rate limiting

**Problem:** Routes stopped working after many requests

**Solutions:**
- You've exceeded the free tier limits (2,000/day or 40/min)
- Wait until the limit resets (daily at midnight UTC)
- Consider upgrading to a paid plan if needed
- Clear browser cache to remove failed attempts

### Routes look weird or go through water

**Problem:** Routes take strange paths

**Solutions:**
- OpenRouteService might not have perfect data for all regions
- Some rural areas may have limited road network data
- This is expected behavior - the API does its best with available data
- You can manually adjust your itinerary if needed

## Technical Details

### How It Works

1. **Hook:** `src/hooks/useRouting.ts`
   - Fetches routes from OpenRouteService API
   - Caches results to avoid duplicate requests
   - Debounces rapid changes (300ms)
   - Returns coordinates, distance, duration

2. **Component:** `src/components/map/RoutingLayer.tsx`
   - Renders the route as a Leaflet Polyline
   - Displays loading state
   - Falls back to straight lines on error

3. **API Request:**
   ```typescript
   POST https://api.openrouteservice.org/v2/directions/driving-car
   Headers: { Authorization: YOUR_API_KEY }
   Body: { coordinates: [[lng, lat], ...] }
   ```

### Caching Strategy

- Routes are cached in-memory using `useRef`
- Cache key: lat/lng rounded to 4 decimals
- Cache persists for the session (cleared on page refresh)
- Same route won't trigger another API call

### Rate Limiting Protection

- 300ms debounce prevents rapid requests
- Cache reduces duplicate requests
- Graceful fallback if quota exceeded
- No impact on app functionality

## Alternative: Using OSRM (Free, No API Key)

If you prefer not to use OpenRouteService, you can switch back to OSRM:

1. Edit `src/hooks/useRouting.ts`
2. Change the API URL to: `https://router.project-osrm.org/route/v1/driving/`
3. Remove the Authorization header
4. Adjust the response parsing (OSRM uses different format)

**OSRM Pros:**
- No API key required
- Truly unlimited requests
- Fast and reliable

**OSRM Cons:**
- Less accurate in some regions
- No distance/duration metrics
- Simpler routing algorithm

## Support

For OpenRouteService API issues:
- Documentation: https://openrouteservice.org/dev/
- API Playground: https://openrouteservice.org/dev/#/api-docs
- GitHub: https://github.com/GIScience/openrouteservice

For app-specific issues:
- Check the browser console for detailed error messages
- Verify your `.env.local` configuration
- Test with a simple 2-location route first
