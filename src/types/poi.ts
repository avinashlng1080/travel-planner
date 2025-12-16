import type { Id } from '../../convex/_generated/dataModel';

export type POICategory = 'shopping' | 'zoo' | 'museum' | 'park' | 'attraction';

export interface POI {
  _id: Id<'pois'>;
  osmId: string;
  osmType: string; // 'node' | 'way' | 'relation'
  category: string; // POICategory but allowing string for flexibility
  name: string;
  lat: number;
  lng: number;
  lastUpdated: number;
  tags?: any;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface POIMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FetchPOIsResult {
  count: number;
  categories: Record<string, number>;
}
