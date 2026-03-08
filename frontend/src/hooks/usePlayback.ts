import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';

/**
 * Timeline State Management Hook
 * 
 * Manages match playback timeline with:
 * - Current playback time
 * - Play/pause state
 * - Auto-advance during playback
 * 
 * Features:
 * - Smooth playback at 1x speed
 * - Pause support
 * - Manual time seeking
 * - Duration tracking
 */
export const useTimeline = (duration: number = 0) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Animation loop for playback
  useEffect(() => {
    if (!isPlaying || duration <= 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const newTime = prev + delta;
        
        // Stop playback when reaching end
        if (newTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        
        return newTime;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Reset time when duration changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [duration]);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const handlePlayPauseToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  return {
    currentTime,
    isPlaying,
    duration,
    setCurrentTime: handleTimeChange,
    togglePlayPause: handlePlayPauseToggle,
    reset,
  };
};

/**
 * Filters State Management Hook
 * 
 * Manages match selection filters with:
 * - Selected date
 * - Selected map
 * - Selected match
 * 
 * Features:
 * - Persistent state via localStorage
 * - Cascading updates (date -> map -> match)
 * - Default date selection
 */
interface FiltersState {
  selectedDate: string;
  selectedMap: string | null;
  selectedMatch: string | null;
}

export const useFilters = () => {
  // Get default date (most recent available)
  const defaultDate = '2026-02-14';

  const [filters, setFilters] = useState<FiltersState>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('playerJourneyFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Return default if parsing fails
      }
    }
    
    return {
      selectedDate: defaultDate,
      selectedMap: null,
      selectedMatch: null,
    };
  });

  // Persist to localStorage when filters change
  useEffect(() => {
    localStorage.setItem('playerJourneyFilters', JSON.stringify(filters));
  }, [filters]);

  const setSelectedDate = useCallback((date: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedDate: date,
      selectedMap: null, // Reset map when date changes
      selectedMatch: null, // Reset match when date changes
    }));
  }, []);

  const setSelectedMap = useCallback((map: string | null) => {
    setFilters((prev) => ({
      ...prev,
      selectedMap: map || null,
      selectedMatch: null, // Reset match when map changes
    }));
  }, []);

  const setSelectedMatch = useCallback((matchId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      selectedMatch: matchId || null,
    }));
  }, []);

  return {
    selectedDate: filters.selectedDate,
    selectedMap: filters.selectedMap,
    selectedMatch: filters.selectedMatch,
    setSelectedDate,
    setSelectedMap,
    setSelectedMatch,
  };
};

/**
 * Event Filtering by Timeline Hook
 * 
 * Filters events to only show those with timestamp <= currentTime
 * 
 * Features:
 * - Efficient filtering
 * - Memoized results
 * - Handles undefined timestamps
 */
interface Event {
  timestamp: number;
  [key: string]: any;
}

export const useTimelineEventFilter = (
  events: Event[],
  currentTime: number
): Event[] => {
  return events.filter((event) => {
    const eventTime = typeof event.timestamp === 'number' ? event.timestamp : 0;
    return eventTime <= currentTime;
  });
};

/**
 * Match Data with Timeline Integration Hook
 * 
 * Enhanced version of useMatchData that includes timeline-aware filtering
 * 
 * Features:
 * - Loads events and journeys
 * - Filters events by current timeline time
 * - Handles loading states
 * - Request deduplication
 */
export const useMatchDataWithTimeline = (matchId: string, currentTime: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedMatchRef = useRef<string>('');

  // Load match data
  useEffect(() => {
    if (!matchId || loadedMatchRef.current === matchId) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load events and journeys in parallel
        const [eventsResponse, journeyResponse] = await Promise.all([
          apiClient.getMatchEvents(matchId),
          apiClient.getMatchJourney(matchId),
        ]);

        setEvents(eventsResponse.events || []);
        setJourneys(journeyResponse.journeys || []);
        loadedMatchRef.current = matchId;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match data');
        console.error('Error loading match data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [matchId]);

  // Filter events by current time
  const filteredEvents = useTimelineEventFilter(events, currentTime);

  return {
    events: filteredEvents,
    allEvents: events, // For reference
    journeys,
    loading,
    error,
  };
};

/**
 * Combined Playback State Hook
 * 
 * Combines timeline, filters, and data loading into one hook
 * 
 * Perfect for MapViewer component to manage all interactive state
 */
export const usePlaybackState = (matchId: string, matchDuration: number) => {
  const timeline = useTimeline(matchDuration);
  const filters = useFilters();
  const matchData = useMatchDataWithTimeline(matchId, timeline.currentTime);

  return {
    // Timeline controls
    timeline,
    // Filter controls
    filters,
    // Data
    matchData,
  };
};

/**
 * Match Statistics Hook
 * 
 * Calculates real-time statistics based on timeline position
 */
interface MatchStats {
  totalKills: number;
  totalDeaths: number;
  totalLoot: number;
  stormDeaths: number;
  activeJourneys: number;
}

export const useMatchStatistics = (
  events: Event[],
  currentTime: number
): MatchStats => {
  const filteredEvents = useTimelineEventFilter(events, currentTime);

  return {
    totalKills: filteredEvents.filter((e) => e.event_type === 'Kill' || e.event_type === 'BotKill').length,
    totalDeaths: filteredEvents.filter((e) => e.event_type === 'Killed' || e.event_type === 'BotKilled').length,
    totalLoot: filteredEvents.filter((e) => e.event_type === 'Loot').length,
    stormDeaths: filteredEvents.filter((e) => e.event_type === 'KilledByStorm').length,
    activeJourneys: new Set(filteredEvents.map((e) => e.player_id)).size,
  };
};
