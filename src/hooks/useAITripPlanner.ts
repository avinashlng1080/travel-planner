/**
 * useAITripPlanner Hook
 *
 * Handles AI tool execution for trip planning, processing Claude API responses
 * and executing tool calls for adding locations and creating itineraries.
 *
 * @param tripId - The ID of the trip to plan for
 *
 * @returns {Object} Hook state and functions
 * - isProcessingTools: Whether tools are currently being processed
 * - lastToolResults: Results from the last tool execution
 * - processToolCalls: Function to process Claude tool use blocks
 * - getTripContext: Function to get trip context for Claude prompts
 * - getTripLocations: Function to get locations for Claude context
 * - clearResults: Function to clear last tool results
 * - tripData: Full trip data including plans and members
 * - locations: Array of trip locations
 *
 * @example
 * ```tsx
 * const {
 *   isProcessingTools,
 *   processToolCalls,
 *   getTripContext,
 *   lastToolResults
 * } = useAITripPlanner(tripId);
 *
 * // Process Claude response with tool calls
 * const results = await processToolCalls(claudeResponse.content);
 *
 * // Get trip context for AI prompts
 * const context = getTripContext();
 * ```
 */

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback } from "react";

interface ToolResult {
  toolName: string;
  success: boolean;
  message: string;
  createdIds?: string[];
  undoAction?: () => Promise<void>;
}

interface AITripPlannerState {
  isProcessingTools: boolean;
  lastToolResults: ToolResult[];
}

export function useAITripPlanner(tripId?: Id<"trips">) {
  // State for tool processing
  const [state, setState] = useState<AITripPlannerState>({
    isProcessingTools: false,
    lastToolResults: [],
  });

  // Get mutations
  const addLocations = useMutation(api.tripLocations.addAISuggestedLocations);
  const removeLocations = useMutation(api.tripLocations.removeMultipleLocations);
  const createItinerary = useMutation(api.tripScheduleItems.createAIItinerary);
  const deleteItems = useMutation(api.tripScheduleItems.deleteMultipleScheduleItems);

  // Get trip data for context
  const tripData = useQuery(
    api.trips.getTripWithDetails,
    tripId ? { tripId } : "skip"
  );

  // Get existing locations for context
  const locations = useQuery(
    api.tripLocations.getLocations,
    tripId ? { tripId } : "skip"
  );

  // Process tool calls from Claude response
  const processToolCalls = useCallback(async (
    content: Array<{ type: string; name?: string; input?: any }>
  ): Promise<ToolResult[]> => {
    if (!tripId) return [];

    setState(prev => ({ ...prev, isProcessingTools: true }));
    const results: ToolResult[] = [];

    const toolCalls = content.filter(
      (block) => block.type === "tool_use" &&
      (block.name === "add_trip_locations" || block.name === "create_itinerary")
    );

    for (const tool of toolCalls) {
      try {
        if (tool.name === "add_trip_locations" && tool.input?.locations) {
          const createdIds = await addLocations({
            tripId,
            locations: tool.input.locations,
          });

          results.push({
            toolName: "add_trip_locations",
            success: true,
            message: `Added ${createdIds.length} locations to your trip`,
            createdIds: createdIds.map(id => id.toString()),
            undoAction: async () => {
              await removeLocations({ locationIds: createdIds });
            },
          });
        }

        if (tool.name === "create_itinerary" && tool.input?.days) {
          // Get the default plan (Plan A)
          const defaultPlan = tripData?.plans?.find(p => p.order === 0);
          if (!defaultPlan) {
            results.push({
              toolName: "create_itinerary",
              success: false,
              message: "No plan found to add itinerary to",
            });
            continue;
          }

          const createdIds = await createItinerary({
            tripId,
            planId: defaultPlan._id,
            days: tool.input.days,
          });

          results.push({
            toolName: "create_itinerary",
            success: true,
            message: `Created itinerary with ${createdIds.length} activities`,
            createdIds: createdIds.map(id => id.toString()),
            undoAction: async () => {
              await deleteItems({ itemIds: createdIds });
            },
          });
        }
      } catch (error) {
        results.push({
          toolName: tool.name || "unknown",
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    setState(prev => ({
      ...prev,
      isProcessingTools: false,
      lastToolResults: results,
    }));

    return results;
  }, [tripId, addLocations, removeLocations, createItinerary, deleteItems, tripData]);

  // Build trip context for Claude
  const getTripContext = useCallback(() => {
    if (!tripData?.trip) return undefined;

    return {
      name: tripData.trip.name,
      description: tripData.trip.description,
      startDate: tripData.trip.startDate,
      endDate: tripData.trip.endDate,
      homeBase: tripData.trip.homeBase,
    };
  }, [tripData]);

  // Build locations array for Claude
  const getTripLocations = useCallback(() => {
    if (!locations) return [];

    return locations.map(loc => ({
      name: loc.customName || "",
      category: loc.customCategory,
      description: loc.customDescription,
      lat: loc.customLat,
      lng: loc.customLng,
    }));
  }, [locations]);

  // Clear last results
  const clearResults = useCallback(() => {
    setState(prev => ({ ...prev, lastToolResults: [] }));
  }, []);

  return {
    ...state,
    processToolCalls,
    getTripContext,
    getTripLocations,
    clearResults,
    tripData,
    locations,
  };
}
