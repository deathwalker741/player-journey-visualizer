/**
 * App Component - Main application entry point
 */

import React, { useState, useEffect } from "react";
import MatchSelector from "./components/MatchSelector";
import MapViewerEnhanced from "./components/MapViewerEnhanced";
import { apiClient } from "./services/api";
import "./App.css";

interface SelectedMatch {
  matchId: string;
  mapName: string;
  duration: number;
}

const App: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchDuration, setMatchDuration] = useState(0);

  // Load match duration when selected
  useEffect(() => {
    if (!selectedMatch) return;

    const loadDuration = async () => {
      try {
        const response = await apiClient.getMatchEvents(selectedMatch.matchId);
        // Calculate duration from events
        if (response.events && response.events.length > 0) {
          const maxTime = Math.max(...response.events.map(e => e.timestamp));
          setMatchDuration(maxTime);
        }
      } catch (error) {
        console.error("Failed to load match duration:", error);
        setMatchDuration(300); // Default 5 minutes
      }
    };

    loadDuration();
  }, [selectedMatch]);

  const handleSelectMatch = (matchId: string, mapName: string, duration?: number) => {
    setLoading(true);
    setMatchDuration(duration || 300);
    setSelectedMatch({ matchId, mapName, duration: duration || 300 });
    setTimeout(() => setLoading(false), 100);
  };

  const handleBackToSelector = () => {
    setSelectedMatch(null);
    setMatchDuration(0);
  };

  return (
    <div className="app">
      {selectedMatch ? (
        <div className="mapViewContainer">
          <MapViewerEnhanced 
            matchId={selectedMatch.matchId} 
            mapName={selectedMatch.mapName}
            matchDuration={matchDuration}
          />
          <button 
            className="backButton" 
            onClick={handleBackToSelector}
            title="Back to match selector"
          >
            ← Back to Matches
          </button>
        </div>
      ) : (
        <MatchSelector 
          onSelectMatch={handleSelectMatch}
          loading={loading}
        />
      )}
    </div>
  );
};

export default App;
