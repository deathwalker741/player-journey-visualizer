/**
 * Enhanced MapViewer with Timeline and Filters Integration
 * 
 * This is the main visualization component that combines:
 * - Interactive timeline playback
 * - Filter controls
 * - Real-time event rendering
 * - Player journey visualization
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { BitmapLayer, ScatterplotLayer, LineLayer, TextLayer } from '@deck.gl/layers';
import { MapboxLayer } from '@deck.gl/mapbox';
import Map, { NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { apiClient, Event, PlayerJourney, MapConfig } from '../services/api';
import { Timeline } from './Timeline';
import { Filters } from './Filters';
import { Heatmap } from './Heatmap';
import { useTimeline, useMatchDataWithTimeline, useMatchStatistics } from '../hooks/usePlayback';

import styles from './MapViewerEnhanced.module.css';

interface MapViewerEnhancedProps {
  matchId: string;
  mapName: string;
  matchDuration: number;
}

interface MarkerData {
  position: [number, number];
  color: number[];
  event: Event;
  type: 'event' | 'journey';
}

interface JourneyLine {
  sourcePosition: [number, number];
  targetPosition: [number, number];
  player_id: string;
  is_bot: boolean;
}

/**
 * MapViewerEnhanced - Complete interactive match visualization
 * 
 * Features:
 * - Timeline playback with play/pause
 * - Filter controls for date/map/match
 * - Real-time event filtering by timeline
 * - Player journey visualization
 * - Interactive hover tooltips
 * - Event type filtering
 * - Match statistics display
 */
export const MapViewerEnhanced: React.FC<MapViewerEnhancedProps> = ({
  matchId,
  mapName,
  matchDuration,
}) => {
  // Timeline state
  const timeline = useTimeline(matchDuration);

  // Data loading with timeline filtering
  const { events: timelineFilteredEvents, allEvents, journeys, loading, error } =
    useMatchDataWithTimeline(matchId, timeline.currentTime);

  // Map and filter state
  const [maps, setMaps] = useState<Array<{ name: string }>>([]);
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [selectedMap, setSelectedMap] = useState<string | null>(mapName);
  const [selectedDate, setSelectedDate] = useState('2026-02-14');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(matchId);

  // Visualization state
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
  const [selectedHeatmapType, setSelectedHeatmapType] = useState<'kills' | 'deaths' | 'traffic' | null>(null);

  // Get match statistics based on timeline
  const stats = useMatchStatistics(allEvents, timeline.currentTime);

  // Load maps on mount
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const response = await apiClient.getMaps();
        setMaps(response.maps.map((m) => ({ name: m.map_id })));
      } catch (error) {
        console.error('Failed to load maps:', error);
      }
    };

    loadMaps();
  }, []);

  // Load map config when map name changes
  useEffect(() => {
    const loadMapConfig = async () => {
      try {
        const response = await apiClient.getMaps();
        const config = response.maps.find((m) => m.map_id === mapName);
        if (config) {
          setMapConfig(config);
        }
      } catch (error) {
        console.error('Failed to load map config:', error);
      }
    };

    loadMapConfig();
  }, [mapName]);

  // Event color mapping
  const getEventColor = useCallback((eventType: string): number[] => {
    switch (eventType) {
      case 'Kill':
      case 'BotKill':
        return [255, 0, 0, 255]; // Red
      case 'Killed':
      case 'BotKilled':
        return [0, 0, 0, 255]; // Black
      case 'KilledByStorm':
        return [128, 0, 128, 255]; // Purple
      case 'Loot':
        return [255, 255, 0, 255]; // Yellow
      default:
        return [100, 100, 100, 255]; // Gray
    }
  }, []);

  // Player color mapping
  const getPlayerColor = useCallback((isBot: boolean): number[] => {
    return isBot ? [0, 165, 255, 255] : [0, 0, 255, 255]; // Light blue vs dark blue
  }, []);

  // Event markers - filtered by timeline
  const eventMarkers = useMemo(() => {
    if (!mapConfig) return [];

    return timelineFilteredEvents
      .filter((e) => {
        // Apply event type filter if any are selected
        if (selectedEventTypes.size > 0) {
          return selectedEventTypes.has(e.event_type);
        }
        return true;
      })
      .map((event) => ({
        position: [event.position_x, event.position_y] as [number, number],
        color: getEventColor(event.event_type),
        event,
        type: 'event' as const,
      }));
  }, [timelineFilteredEvents, selectedEventTypes, getEventColor, mapConfig]);

  // Journey markers and lines
  const { journeyMarkers, journeyLines } = useMemo(() => {
    const markers: MarkerData[] = [];
    const lines: JourneyLine[] = [];

    if (!mapConfig) return { journeyMarkers: markers, journeyLines: lines };

    journeys.forEach((journey) => {
      if (!journey.positions || journey.positions.length === 0) return;

      const startPos = journey.positions[0];
      markers.push({
        position: [startPos.x, startPos.y] as [number, number],
        color: getPlayerColor(journey.is_bot),
        event: {
          player_id: journey.player_id,
          event_type: 'PlayerStart',
          timestamp: 0,
          position_x: startPos.x,
          position_y: startPos.y,
          match_id: matchId,
        } as any,
        type: 'journey',
      });

      // Create line segments for the journey
      for (let i = 0; i < journey.positions.length - 1; i++) {
        const source = journey.positions[i];
        const target = journey.positions[i + 1];

        // Only draw line segment if both points are before current time
        // (This creates a progressive reveal effect)
        lines.push({
          sourcePosition: [source.x, source.y] as [number, number],
          targetPosition: [target.x, target.y] as [number, number],
          player_id: journey.player_id,
          is_bot: journey.is_bot,
        });
      }
    });

    return { journeyMarkers: markers, journeyLines: lines };
  }, [journeys, mapConfig, getPlayerColor, matchId]);

  // Deck.gl layers
  const layers = useMemo(() => {
    const layerList: any[] = [];

    if (mapConfig) {
      // Minimap background
      layerList.push(
        new BitmapLayer({
          id: 'minimap-layer',
          image: mapConfig.minimap_url,
          bounds: [0, 0, mapConfig.minimap_width, mapConfig.minimap_height],
        })
      );
    }

    if (showEvents && eventMarkers.length > 0) {
      // Event markers
      layerList.push(
        new ScatterplotLayer({
          id: 'events-layer',
          data: eventMarkers,
          getPosition: (d) => d.position,
          getFillColor: (d) => d.color,
          getRadius: 6,
          pickable: true,
          onHover: (info) => setHoveredMarker(info.object),
        })
      );
    }

    if (showJourneys && journeyLines.length > 0) {
      // Journey paths
      layerList.push(
        new LineLayer({
          id: 'journeys-layer',
          data: journeyLines,
          getSourcePosition: (d) => d.sourcePosition,
          getTargetPosition: (d) => d.targetPosition,
          getColor: (d) => (d.is_bot ? [0, 165, 255, 100] : [0, 0, 255, 100]),
          getWidth: 2,
          pickable: false,
        })
      );
    }

    if (showJourneys && journeyMarkers.length > 0) {
      // Journey start markers
      layerList.push(
        new ScatterplotLayer({
          id: 'journeys-markers-layer',
          data: journeyMarkers,
          getPosition: (d) => d.position,
          getFillColor: (d) => d.color,
          getRadius: 8,
          pickable: true,
          onHover: (info) => setHoveredMarker(info.object),
        })
      );
    }

    return layerList;
  }, [showEvents, showJourneys, eventMarkers, journeyLines, journeyMarkers]);

  // Toggle event type filter
  const toggleEventType = useCallback((eventType: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) {
        next.delete(eventType);
      } else {
        next.add(eventType);
      }
      return next;
    });
  }, []);

  // Available event types from data
  const availableEventTypes = useMemo(() => {
    const types = new Set<string>();
    allEvents.forEach((e) => types.add(e.event_type));
    return Array.from(types).sort();
  }, [allEvents]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Match Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Main map container */}
      <div className={styles.mapContainer}>
        {loading ? (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <p>Loading match data...</p>
          </div>
        ) : (
          <DeckGL
            initialViewState={viewState}
            controller={true}
            layers={layers}
            onViewStateChange={(e) => setViewState(e.viewState)}
          >
            {/* Mapbox background (optional) */}
            <Map mapStyle="mapbox://styles/mapbox/dark-v11">
              <NavigationControl position="top-right" />
            </Map>
          </DeckGL>
        )}

        {/* Hover Tooltip */}
        {hoveredMarker && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(hoveredMarker.position[0] / 1024) * 100}%`,
              top: `${(hoveredMarker.position[1] / 1024) * 100}%`,
            }}
          >
            <div className={styles.tooltipHeader}>
              {hoveredMarker.event.event_type}
            </div>
            <div className={styles.tooltipContent}>
              <div>
                <strong>Player:</strong> {hoveredMarker.event.player_id.slice(0, 8)}...
              </div>
              <div>
                <strong>Time:</strong> {Math.floor(hoveredMarker.event.timestamp)}s
              </div>
              <div>
                <strong>Pos:</strong> ({Math.round(hoveredMarker.event.position_x)}, {Math.round(hoveredMarker.event.position_y)})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Sidebar */}
      <div className={styles.controlsContainer}>
        {/* Timeline Playback */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Timeline</h3>
          <Timeline
            currentTime={timeline.currentTime}
            duration={timeline.duration}
            isPlaying={timeline.isPlaying}
            onTimeChange={timeline.setCurrentTime}
            onPlayPauseToggle={timeline.togglePlayPause}
          />
        </div>

        {/* Filters */}
        <div className={styles.section}>
          <Filters
            selectedMap={selectedMap}
            selectedMatch={selectedMatch}
            selectedDate={selectedDate}
            maps={maps}
            onMapChange={setSelectedMap}
            onMatchChange={setSelectedMatch}
            onDateChange={setSelectedDate}
            isLoading={loading}
          />
        </div>

        {/* Display Options */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Display</h3>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />
            <span>Show Events</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showJourneys}
              onChange={(e) => setShowJourneys(e.target.checked)}
            />
            <span>Show Journeys</span>
          </label>
        </div>

        {/* Heatmap Controls */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Heatmaps</h3>
          <div className={styles.heatmapButtons}>
            <button
              className={`${styles.heatmapButton} ${selectedHeatmapType === 'kills' ? styles.active : ''}`}
              onClick={() => setSelectedHeatmapType(selectedHeatmapType === 'kills' ? null : 'kills')}
              style={{ borderColor: '#ff0000' }}
            >
              Kills
            </button>
            <button
              className={`${styles.heatmapButton} ${selectedHeatmapType === 'deaths' ? styles.active : ''}`}
              onClick={() => setSelectedHeatmapType(selectedHeatmapType === 'deaths' ? null : 'deaths')}
              style={{ borderColor: '#000000' }}
            >
              Deaths
            </button>
            <button
              className={`${styles.heatmapButton} ${selectedHeatmapType === 'traffic' ? styles.active : ''}`}
              onClick={() => setSelectedHeatmapType(selectedHeatmapType === 'traffic' ? null : 'traffic')}
              style={{ borderColor: '#0032ff' }}
            >
              Traffic
            </button>
          </div>
        </div>

        {/* Event Type Filters */}
        {availableEventTypes.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Event Types</h3>
            <div className={styles.eventTypeList}>
              {availableEventTypes.map((type) => (
                <label key={type} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedEventTypes.has(type)}
                    onChange={() => toggleEventType(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Statistics @ {Math.floor(timeline.currentTime)}s</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Kills</span>
              <span className={styles.statValue} style={{ color: '#ff0000' }}>
                {stats.totalKills}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Deaths</span>
              <span className={styles.statValue} style={{ color: '#000000' }}>
                {stats.totalDeaths}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Loot</span>
              <span className={styles.statValue} style={{ color: '#ffff00' }}>
                {stats.totalLoot}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Storm</span>
              <span className={styles.statValue} style={{ color: '#800080' }}>
                {stats.stormDeaths}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewerEnhanced;
