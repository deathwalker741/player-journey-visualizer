/**
 * MapViewer Component - Main visualization using Deck.gl
 * Displays minimap with overlaid event markers and player journeys
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DeckGL from "@deck.gl/react";
import { BitmapLayer, ScatterplotLayer, LineLayer, TextLayer } from "@deck.gl/layers";
import { MapboxLayer } from "@deck.gl/mapbox";
import Map, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { apiClient, Event, PlayerJourney, MapConfig } from "../services/api";
import styles from "./MapViewer.module.css";

interface MapViewerProps {
  matchId: string;
  mapName: string;
  onHover?: (info: any) => void;
}

interface MarkerData {
  position: [number, number];
  color: number[];
  event: Event;
  type: "event" | "journey";
}

interface JourneyLine {
  sourcePosition: [number, number];
  targetPosition: [number, number];
  player_id: string;
  is_bot: boolean;
}

const MapViewer: React.FC<MapViewerProps> = ({
  matchId,
  mapName,
  onHover,
}) => {
  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [journeys, setJourneys] = useState<PlayerJourney[]>([]);
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: 512,
    longitude: 512,
    zoom: 8,
    pitch: 0,
    bearing: 0,
  });
  const [showJourneys, setShowJourneys] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(
    new Set()
  );
  const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null);

  // Load map config and data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get map config
        const mapsResp = await apiClient.getMaps();
        const config = mapsResp.maps.find((m) => m.map_id === mapName);
        if (config) {
          setMapConfig(config);
        }

        // Load events
        const eventsResp = await apiClient.getMatchEvents(matchId);
        setEvents(eventsResp.events);

        // Load journeys
        const journeyResp = await apiClient.getMatchJourney(matchId);
        setJourneys(journeyResp.journeys);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load match data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [matchId, mapName]);

  // Event color mapping
  const getEventColor = useCallback((eventType: string): number[] => {
    switch (eventType) {
      case "Kill":
      case "BotKill":
        return [255, 0, 0, 255]; // Red
      case "Killed":
      case "BotKilled":
        return [0, 0, 0, 255]; // Black (skull)
      case "KilledByStorm":
        return [128, 0, 128, 255]; // Purple
      case "Loot":
        return [255, 255, 0, 255]; // Yellow
      default:
        return [100, 100, 100, 255]; // Gray
    }
  }, []);

  // Player journey color
  const getPlayerColor = useCallback((isBot: boolean): number[] => {
    return isBot ? [0, 165, 255, 255] : [0, 0, 255, 255]; // Light blue for bot, blue for human
  }, []);

  // Filter events based on selection
  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.size === 0) return events;
    return events.filter((e) => selectedEventTypes.has(e.event_type));
  }, [events, selectedEventTypes]);

  // Convert events to Deck.gl markers
  const eventMarkers: MarkerData[] = useMemo(() => {
    return filteredEvents.map((event) => ({
      position: [event.pixel_x, event.pixel_y] as [number, number],
      color: getEventColor(event.event_type),
      event,
      type: "event" as const,
    }));
  }, [filteredEvents, getEventColor]);

  // Convert journeys to Deck.gl line layers
  const journeyLines: JourneyLine[] = useMemo(() => {
    const lines: JourneyLine[] = [];

    journeys.forEach((journey) => {
      if (journey.positions.length < 2) return;

      for (let i = 0; i < journey.positions.length - 1; i++) {
        const pos1 = journey.positions[i];
        const pos2 = journey.positions[i + 1];

        lines.push({
          sourcePosition: [pos1.pixel_x, pos1.pixel_y],
          targetPosition: [pos2.pixel_x, pos2.pixel_y],
          player_id: journey.player_id,
          is_bot: journey.is_bot,
        });
      }
    });

    return lines;
  }, [journeys]);

  // Journey start/end markers
  const journeyMarkers: MarkerData[] = useMemo(() => {
    const markers: MarkerData[] = [];

    journeys.forEach((journey) => {
      if (journey.positions.length === 0) return;

      const firstPos = journey.positions[0];
      const lastPos = journey.positions[journey.positions.length - 1];

      // Create a dummy event for visualization
      const startEvent: Event = {
        event_type: "Position",
        pixel_x: firstPos.pixel_x,
        pixel_y: firstPos.pixel_y,
        ts: firstPos.ts,
        player_id: journey.player_id,
        target_id: null,
      };

      markers.push({
        position: [firstPos.pixel_x, firstPos.pixel_y] as [number, number],
        color: getPlayerColor(journey.is_bot),
        event: startEvent,
        type: "journey" as const,
      });
    });

    return markers;
  }, [journeys, getPlayerColor]);

  // Combined markers for rendering
  const allMarkers = useMemo(() => {
    const markers: MarkerData[] = [...eventMarkers];
    if (showJourneys) {
      markers.push(...journeyMarkers);
    }
    return markers;
  }, [eventMarkers, journeyMarkers, showJourneys]);

  // Deck.gl layers
  const layers = useMemo(() => {
    const layerList: any[] = [];

    // Background image layer
    if (mapConfig) {
      layerList.push(
        new BitmapLayer({
          id: "minimap-layer",
          image: mapConfig.minimap_url,
          bounds: [0, 0, mapConfig.minimap_width, mapConfig.minimap_height],
        })
      );
    }

    // Event markers layer
    if (showEvents && eventMarkers.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: "events-layer",
          data: eventMarkers,
          getPosition: (d: MarkerData) => d.position,
          getFillColor: (d: MarkerData) => d.color,
          getRadius: 8,
          pickable: true,
          onHover: (info: any) => {
            if (info.object) {
              setHoveredMarker(info.object);
              onHover?.(info.object);
            }
          },
          radiusScale: 1,
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
        })
      );
    }

    // Player journey lines
    if (showJourneys && journeyLines.length > 0) {
      layerList.push(
        new LineLayer({
          id: "journey-lines-layer",
          data: journeyLines,
          getSourcePosition: (d: JourneyLine) => d.sourcePosition,
          getTargetPosition: (d: JourneyLine) => d.targetPosition,
          getColor: (d: JourneyLine) => (d.is_bot ? [0, 165, 255, 100] : [0, 0, 255, 100]),
          getWidth: 2,
          pickable: false,
        })
      );
    }

    // Player journey start markers
    if (showJourneys && journeyMarkers.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: "journey-markers-layer",
          data: journeyMarkers,
          getPosition: (d: MarkerData) => d.position,
          getFillColor: (d: MarkerData) => d.color,
          getRadius: 10,
          pickable: true,
          onHover: (info: any) => {
            if (info.object) {
              setHoveredMarker(info.object);
              onHover?.(info.object);
            }
          },
          radiusScale: 1,
          radiusMinPixels: 5,
          radiusMaxPixels: 25,
        })
      );
    }

    return layerList;
  }, [mapConfig, eventMarkers, journeyLines, journeyMarkers, showEvents, showJourneys, onHover]);

  // Handle event type filter toggle
  const toggleEventType = (eventType: string) => {
    const newSelected = new Set(selectedEventTypes);
    if (newSelected.has(eventType)) {
      newSelected.delete(eventType);
    } else {
      newSelected.add(eventType);
    }
    setSelectedEventTypes(newSelected);
  };

  if (loading) {
    return <div className={styles.loading}>Loading map data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mapContainer}>
        <DeckGL
          initialViewState={viewState}
          controller={true}
          layers={layers}
          onViewStateChange={(state) => setViewState(state.viewState)}
        >
          {mapConfig && (
            <Map
              mapStyle="mapbox://styles/mapbox/light-v11"
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
            >
              <NavigationControl position="top-left" />
            </Map>
          )}
        </DeckGL>
      </div>

      <div className={styles.controls}>
        <div className={styles.section}>
          <h3>Display Options</h3>
          <label>
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />
            Show Events
          </label>
          <label>
            <input
              type="checkbox"
              checked={showJourneys}
              onChange={(e) => setShowJourneys(e.target.checked)}
            />
            Show Player Journeys
          </label>
        </div>

        <div className={styles.section}>
          <h3>Event Types</h3>
          {["Kill", "Killed", "BotKill", "BotKilled", "Loot", "KilledByStorm"].map(
            (type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={selectedEventTypes.size === 0 || selectedEventTypes.has(type)}
                  onChange={() => toggleEventType(type)}
                />
                {type}
              </label>
            )
          )}
        </div>

        {hoveredMarker && (
          <div className={styles.tooltip}>
            <h4>Event Details</h4>
            <p>
              <strong>Type:</strong> {hoveredMarker.event.event_type}
            </p>
            <p>
              <strong>Player:</strong> {hoveredMarker.event.player_id.slice(0, 8)}...
            </p>
            <p>
              <strong>Position:</strong> ({hoveredMarker.event.pixel_x.toFixed(0)}, 
              {hoveredMarker.event.pixel_y.toFixed(0)})
            </p>
            <p>
              <strong>Time:</strong> {(hoveredMarker.event.ts / 1000).toFixed(1)}s
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapViewer;
