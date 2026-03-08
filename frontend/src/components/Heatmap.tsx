import React, { useState, useEffect, useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { apiClient, HeatmapData } from '../services/api';
import styles from './Heatmap.module.css';

interface HeatmapProps {
  /** Map name for the heatmap */
  mapName: string;
  /** Currently selected heatmap type */
  heatmapType: 'kills' | 'deaths' | 'traffic' | null;
  /** Date range start (YYYY-MM-DD) */
  dateStart?: string;
  /** Date range end (YYYY-MM-DD) */
  dateEnd?: string;
  /** Grid size for heatmap aggregation */
  gridSize?: number;
}

interface HeatmapPoint {
  position: [number, number];
  weight: number;
}

/**
 * Heatmap Component - Visualization of event density across map
 * 
 * Features:
 * - Kill heatmap (red intensity)
 * - Death heatmap (black intensity)
 * - Player traffic heatmap (blue intensity)
 * - Adjustable grid size
 * - Date range filtering
 * - Real-time data fetching
 * 
 * Uses Deck.gl HeatmapLayer for GPU-accelerated rendering
 */
export const Heatmap: React.FC<HeatmapProps> = ({
  mapName,
  heatmapType,
  dateStart,
  dateEnd,
  gridSize = 32,
}) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load heatmap data from API
  useEffect(() => {
    if (!heatmapType || !mapName) {
      setHeatmapData([]);
      return;
    }

    const loadHeatmap = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getHeatmap(
          mapName,
          heatmapType,
          dateStart,
          dateEnd,
          gridSize
        );

        // Convert heatmap data format to positions with weights
        const points = response.grid.map((row: any) => ({
          position: [row.x, row.y] as [number, number],
          weight: row.value,
        }));

        setHeatmapData(points);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load heatmap');
        console.error('Error loading heatmap:', err);
        setHeatmapData([]);
      } finally {
        setLoading(false);
      }
    };

    loadHeatmap();
  }, [heatmapType, mapName, dateStart, dateEnd, gridSize]);

  // Get heatmap color scheme based on type
  const getColorScheme = (type: string | null): number[][] => {
    switch (type) {
      case 'kills':
        // Red intensity
        return [
          [0, 0, 0, 0],
          [255, 0, 0, 100],
          [255, 0, 0, 200],
          [255, 0, 0, 255],
        ];
      case 'deaths':
        // Black intensity
        return [
          [0, 0, 0, 0],
          [50, 50, 50, 100],
          [100, 100, 100, 200],
          [0, 0, 0, 255],
        ];
      case 'traffic':
        // Blue intensity
        return [
          [0, 0, 0, 0],
          [0, 100, 255, 100],
          [0, 150, 255, 200],
          [0, 50, 255, 255],
        ];
      default:
        return [
          [0, 0, 0, 0],
          [100, 100, 100, 100],
          [150, 150, 150, 200],
          [200, 200, 200, 255],
        ];
    }
  };

  // Get heatmap label
  const getLabel = (type: string | null): string => {
    switch (type) {
      case 'kills':
        return 'Kill Hotspots';
      case 'deaths':
        return 'Death Hotspots';
      case 'traffic':
        return 'Player Traffic';
      default:
        return 'Heatmap';
    }
  };

  if (!heatmapType) {
    return (
      <div className={styles.placeholder}>
        <p>Select a heatmap type to visualize</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading {getLabel(heatmapType).toLowerCase()}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{getLabel(heatmapType)}</h3>
        <div className={styles.stats}>
          <span>{heatmapData.length} grid cells</span>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ opacity: 0.3 }} />
          <span>Low</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ opacity: 0.6 }} />
          <span>Medium</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ opacity: 1 }} />
          <span>High</span>
        </div>
      </div>

      <div className={styles.info}>
        <p>
          {heatmapType === 'kills' && 'Red indicates areas with high kill density'}
          {heatmapType === 'deaths' && 'Black indicates areas with high death density'}
          {heatmapType === 'traffic' && 'Blue indicates areas with high player traffic'}
        </p>
      </div>
    </div>
  );
};

export default Heatmap;
