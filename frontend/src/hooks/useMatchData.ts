/**
 * Custom React hooks for the visualization tool
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { apiClient, Event, PlayerJourney } from "../services/api";

/**
 * Hook for loading and caching match data
 */
export const useMatchData = (matchId: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [journeys, setJourneys] = useState<PlayerJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to prevent duplicate requests
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loadedRef.current.has(matchId)) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [eventsResp, journeyResp] = await Promise.all([
          apiClient.getMatchEvents(matchId),
          apiClient.getMatchJourney(matchId),
        ]);

        setEvents(eventsResp.events);
        setJourneys(journeyResp.journeys);
        loadedRef.current.add(matchId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [matchId]);

  return { events, journeys, loading, error };
};

/**
 * Hook for filtering events based on type
 */
export const useEventFilter = (events: Event[], initialFilter?: Set<string>) => {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    initialFilter || new Set()
  );

  const toggleEventType = useCallback((eventType: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) {
        next.delete(eventType);
      } else {
        next.add(eventType);
      }
      return next;
    });
  }, []);

  const filteredEvents = events.filter(
    (e) => selectedTypes.size === 0 || selectedTypes.has(e.event_type)
  );

  return { filteredEvents, selectedTypes, toggleEventType };
};

/**
 * Hook for debounced search/filter updates
 */
export const useDebounce = <T,>(value: T, delay: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing paginated data
 */
export const usePagination = <T,>(
  items: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
  };
};

/**
 * Hook for local storage persistence
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};

/**
 * Hook for intersection observer (lazy loading)
 */
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [options]);

  return { elementRef, isVisible };
};
