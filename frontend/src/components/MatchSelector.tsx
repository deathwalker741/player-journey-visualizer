/**
 * MatchSelector Component - Browse and select matches
 */

import React, { useState, useEffect } from "react";
import { apiClient, MatchSummary, MapsResponse } from "../services/api";
import styles from "./MatchSelector.module.css";

interface MatchSelectorProps {
  onSelectMatch: (matchId: string, mapName: string, duration?: number) => void;
  loading?: boolean;
}

const MatchSelector: React.FC<MatchSelectorProps> = ({
  onSelectMatch,
  loading = false,
}) => {
  // State
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [maps, setMaps] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMap, setSelectedMap] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const pageSize = 10;

  // Load available maps on mount
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const response = await apiClient.getMaps();
        setMaps(response.maps.map((m) => m.map_id));
      } catch (error) {
        console.error("Failed to load maps:", error);
      }
    };

    loadMaps();
  }, []);

  // Load matches when filters change
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMatches(
          selectedDate || undefined,
          selectedMap || undefined,
          pageSize,
          page * pageSize
        );
        setMatches(response.matches);
        setTotal(response.total);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load matches:", error);
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [selectedDate, selectedMap, page]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setPage(0); // Reset to first page
  };

  // Handle map change
  const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMap(e.target.value);
    setPage(0); // Reset to first page
  };

  // Handle match selection
  const handleSelectMatch = (match: MatchSummary) => {
    onSelectMatch(match.match_id, match.map, match.duration_seconds);
  };

  // Calculate pagination
  const maxPages = Math.ceil(total / pageSize);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Player Journey Visualization</h1>
        <p>Select a match to visualize player activity</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min="2026-02-10"
            max="2026-02-14"
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Map</label>
          <select value={selectedMap} onChange={handleMapChange}>
            <option value="">All Maps</option>
            {maps.map((map) => (
              <option key={map} value={map}>
                {map}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.stats}>
          <span>Total Matches: {total}</span>
          <span>Page {page + 1} of {maxPages || 1}</span>
        </div>
      </div>

      <div className={styles.matchesList}>
        {isLoading ? (
          <div className={styles.loading}>Loading matches...</div>
        ) : matches.length > 0 ? (
          <div className={styles.grid}>
            {matches.map((match) => (
              <div
                key={match.match_id}
                className={styles.matchCard}
                onClick={() => handleSelectMatch(match)}
              >
                <div className={styles.matchHeader}>
                  <h3>{match.map}</h3>
                  <span className={styles.date}>{match.date}</span>
                </div>

                <div className={styles.matchDetails}>
                  <div className={styles.stat}>
                    <span className={styles.label}>Players</span>
                    <span className={styles.value}>{match.player_count}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Humans</span>
                    <span className={styles.value} style={{ color: "#0066cc" }}>
                      {match.human_count}
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Bots</span>
                    <span className={styles.value} style={{ color: "#00a3ff" }}>
                      {match.bot_count}
                    </span>
                  </div>
                </div>

                <div className={styles.matchFooter}>
                  <span className={styles.duration}>
                    {(match.duration_ms / 60000).toFixed(1)} min
                  </span>
                  <button className={styles.viewButton}>View Match</button>
                </div>

                <div className={styles.matchId}>
                  ID: {match.match_id.slice(0, 12)}...
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No matches found for the selected filters.</p>
            <p className={styles.hint}>Try adjusting your date or map selection.</p>
          </div>
        )}
      </div>

      {maxPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={styles.paginationButton}
          >
            ← Previous
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, maxPages) }).map((_, i) => {
              const pageNum = Math.max(0, page - 2) + i;
              if (pageNum >= maxPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`${styles.pageButton} ${
                    pageNum === page ? styles.active : ""
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(maxPages - 1, page + 1))}
            disabled={page >= maxPages - 1}
            className={styles.paginationButton}
          >
            Next →
          </button>
        </div>
      )}

      {loading && <div className={styles.overlay}>Loading...</div>}
    </div>
  );
};

export default MatchSelector;
