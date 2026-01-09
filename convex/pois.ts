import { v } from 'convex/values';
import { action, internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';

// Fetch POIs from Overpass API for a specified region
export const fetchPOIsForRegion = action({
  args: {
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
  },
  handler: async (ctx, { north, south, east, west }) => {
    // Overpass API query for POIs in Malaysia
    const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="shopping_mall"](${south},${west},${north},${east});
  way["amenity"="shopping_mall"](${south},${west},${north},${east});
  node["tourism"="zoo"](${south},${west},${north},${east});
  node["tourism"="aquarium"](${south},${west},${north},${east});
  node["tourism"="museum"](${south},${west},${north},${east});
  node["tourism"="gallery"](${south},${west},${north},${east});
  node["tourism"="attraction"](${south},${west},${north},${east});
  node["leisure"="park"](${south},${west},${north},${east});
  way["leisure"="park"](${south},${west},${north},${east});
);
out center;
    `.trim();

    console.log('Fetching POIs from Overpass API...');

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: overpassQuery,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      console.log(`Fetched ${data.elements?.length || 0} POIs from Overpass API`);

      // Transform OSM data to POI format
      const pois = data.elements.map((element: any) => {
        const lat = element.center?.lat ?? element.lat;
        const lng = element.center?.lon ?? element.lon;

        return {
          osmId: element.id.toString(),
          osmType: element.type,
          name: element.tags?.name ?? 'Unnamed',
          lat,
          lng,
          category: categorizePOI(element.tags),
          tags: element.tags,
          lastUpdated: Date.now(),
        };
      });

      // Filter out POIs without valid coordinates
      const validPOIs = pois.filter((poi: any) => poi.lat && poi.lng);

      console.log(`Inserting ${validPOIs.length} valid POIs into database...`);

      // Batch insert into database
      await ctx.runMutation(internal.pois.insertBatch, { pois: validPOIs });

      return {
        count: validPOIs.length,
        categories: validPOIs.reduce((acc: Record<string, number>, poi: any) => {
          acc[poi.category] = (acc[poi.category] ?? 0) + 1;
          return acc;
        }, {}),
      };
    } catch (error: any) {
      console.error('Error fetching POIs:', error);
      throw new Error(`Failed to fetch POIs: ${error.message}`);
    }
  },
});

// Helper function to categorize POI based on OSM tags
function categorizePOI(tags: any): string {
  if (tags.amenity === 'shopping_mall') {return 'shopping';}
  if (tags.tourism === 'zoo' || tags.tourism === 'aquarium') {return 'zoo';}
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') {return 'museum';}
  if (tags.leisure === 'park') {return 'park';}
  if (tags.tourism === 'attraction') {return 'attraction';}
  return 'attraction'; // Default fallback
}

// Internal mutation to batch insert POIs
export const insertBatch = internalMutation({
  args: {
    pois: v.array(
      v.object({
        osmId: v.string(),
        osmType: v.string(),
        name: v.string(),
        lat: v.number(),
        lng: v.number(),
        category: v.string(),
        tags: v.any(),
        lastUpdated: v.number(),
      })
    ),
  },
  handler: async (ctx, { pois }) => {
    // Check for existing POIs and update/insert accordingly
    for (const poi of pois) {
      const existing = await ctx.db
        .query('pois')
        .withIndex('by_osmId', (q) => q.eq('osmId', poi.osmId))
        .first();

      if (existing) {
        // Update existing POI
        await ctx.db.patch(existing._id, {
          name: poi.name,
          lat: poi.lat,
          lng: poi.lng,
          category: poi.category,
          tags: poi.tags,
          lastUpdated: poi.lastUpdated,
        });
      } else {
        // Insert new POI
        await ctx.db.insert('pois', poi);
      }
    }

    console.log(`Processed ${pois.length} POIs`);
  },
});

// Query POIs by viewport bounds for efficient rendering
export const getPOIsByViewport = query({
  args: {
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
    categories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { north, south, east, west, categories }) => {
    // Query all POIs (we'll filter in memory since Convex doesn't support geo queries yet)
    let pois = await ctx.db.query('pois').collect();

    // Filter by bounds
    pois = pois.filter(
      (poi) => poi.lat >= south && poi.lat <= north && poi.lng >= west && poi.lng <= east
    );

    // Filter by categories if specified
    if (categories && categories.length > 0) {
      pois = pois.filter((poi) => categories.includes(poi.category));
    }

    return pois;
  },
});

// Mutation to clear all POIs (useful for testing)
export const clearAll = mutation({
  handler: async (ctx) => {
    const pois = await ctx.db.query('pois').collect();
    for (const poi of pois) {
      await ctx.db.delete(poi._id);
    }
    return { deleted: pois.length };
  },
});

// Query to get all POIs (for debugging)
export const getAllPOIs = query({
  handler: async (ctx) => {
    return await ctx.db.query('pois').collect();
  },
});

// Query to get POI count by category (for debugging)
export const getPOICountByCategory = query({
  handler: async (ctx) => {
    const pois = await ctx.db.query('pois').collect();
    return pois.reduce((acc: Record<string, number>, poi) => {
      acc[poi.category] = (acc[poi.category] || 0) + 1;
      return acc;
    }, {});
  },
});
