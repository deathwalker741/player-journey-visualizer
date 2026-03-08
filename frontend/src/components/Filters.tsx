import React, { useEffect, useState } from 'react';
import styles from './Filters.module.css';
import { apiClient } from '../services/api';

interface FiltersProps {
  /** Currently selected map name */
  selectedMap: string | null;
  /** Currently selected match ID */
  selectedMatch: string | null;
  /** Currently selected date (YYYY-MM-DD format) */
  selectedDate: string;
  /** Available maps from API */
  maps: Array<{ name: string }>;
  /** Called when map selection changes */
  onMapChange: (mapName: string) => void;
  /** Called when match selection changes */
  onMatchChange: (matchId: string) => void;
  /** Called when date changes */
  onDateChange: (date: string) => void;
  /** Whether filters are in loading state */
  isLoading?: boolean;
}

interface Match {
  match_id: string;
  map_name: string;
  created_at: string;
  player_count: number;
  human_count: number;
  bot_count: number;
  duration_seconds: number;
}

/**
 * Filters component for match and event filtering
 * 
 * Features:
 * - Map selector dropdown
 * - Date range picker (Feb 10-14, 2026)
 * - Match selector with available matches for selected date/map
 * - Real-time updates when filters change
 * 
 * Workflow:
 * 1. User selects date
 * 2. User selects map
 * 3. Component fetches matches for that date/map combination
 * 4. User selects a specific match
 * 5. Parent component loads match data and updates visualization
 */
export const Filters: React.FC<FiltersProps> = ({
  selectedMap,
  selectedMatch,
  selectedDate,
  maps,
  onMapChange,
  onMatchChange,
  onDateChange,
  isLoading = false,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Available dates from the dataset
  const availableDates = [
    '2026-02-10',
    '2026-02-11',
    '2026-02-12',
    '2026-02-13',
    '2026-02-14',
  ];

  // Load matches when date or map changes
  useEffect(() => {
    if (!selectedDate) return;

    const loadMatches = async () => {
      setMatchesLoading(true);
      try {
        const response = await apiClient.getMatches(
          selectedDate,
          selectedMap || undefined,
          100 // Load more matches to provide better selection
        );
        setMatches(response.matches || []);
        
        // Reset match selection if current match not in new list
        if (selectedMatch && !response.matches?.some(m => m.match_id === selectedMatch)) {
          onMatchChange('');
        }
      } catch (error) {
        console.error('Failed to load matches:', error);
        setMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    };

    loadMatches();
  }, [selectedDate, selectedMap, selectedMatch, onMatchChange]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDateChange(e.target.value);
  };

  // Handle map change
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMapChange(e.target.value);
  };

  // Handle match change
  const handleMatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMatchChange(e.target.value);
  };

  // Find display info for selected match
  const selectedMatchData = matches.find(m => m.match_id === selectedMatch);
  const matchDuration = selectedMatchData ? selectedMatchData.duration_seconds : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filters & Selection</h2>
        {isLoading && <div className={styles.loadingIndicator} />}
      </div>

      <div className={styles.filterGroup}>
        {/* Date Selector */}
        <div className={styles.filterItem}>
          <label htmlFor="date-select" className={styles.label}>
            Date
          </label>
          <select
            id="date-select"
            className={styles.select}
            value={selectedDate}
            onChange={handleDateChange}
            disabled={isLoading}
          >
            <option value="">Select a date...</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Map Selector */}
        <div className={styles.filterItem}>
          <label htmlFor="map-select" className={styles.label}>
            Map
          </label>
          <select
            id="map-select"
            className={styles.select}
            value={selectedMap || ''}
            onChange={handleMapChange}
            disabled={!selectedDate || isLoading}
          >
            <option value="">All maps</option>
            {maps.map((map) => (
              <option key={map.name} value={map.name}>
                {map.name}
              </option>
            ))}
          </select>
        </div>

        {/* Match Selector */}
        <div className={styles.filterItem}>
          <label htmlFor="match-select" className={styles.label}>
            Match
          </label>
          <select
            id="match-select"
            className={styles.select}
            value={selectedMatch || ''}
            onChange={handleMatchChange}
            disabled={!selectedDate || matchesLoading || isLoading}
          >
            <option value="">
              {matchesLoading ? 'Loading matches...' : 'Select a match...'}
            </option>
            {matches.map((match) => (
              <option key={match.match_id} value={match.match_id}>
                {match.map_name} • {match.player_count} players ({match.human_count}H/{match.bot_count}B)
                • {Math.round(match.duration_seconds / 60)}m
              </option>
            ))}
          </select>
          {matches.length === 0 && selectedDate && !matchesLoading && (
            <div className={styles.emptyState}>No matches found for selected filters</div>
          )}
        </div>
      </div>

      {/* Match Info Card */}
      {selectedMatchData && (
        <div className={styles.matchInfo}>
          <div className={styles.infoHeader}>
            <h3 className={styles.infoTitle}>Match Details</h3>
            <span className={styles.infoBadge}>{selectedMatchData.map_name}</span>
          </div>
          
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Duration</span>
              <span className={styles.infoValue}>
                {Math.floor(selectedMatchData.duration_seconds / 60)}:{(selectedMatchData.duration_seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Total Players</span>
              <span className={styles.infoValue}>{selectedMatchData.player_count}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Humans</span>
              <span className={styles.infoValue} style={{ color: '#3182ce' }}>
                {selectedMatchData.human_count}
              </span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Bots</span>
              <span className={styles.infoValue} style={{ color: '#00a3e0' }}>
                {selectedMatchData.bot_count}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className={styles.helpText}>
        <p>
          💡 <strong>Tip:</strong> Select a date first, then choose a map to filter matches.
        </p>
      </div>
    </div>
  );
};

export default Filters;
