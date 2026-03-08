import React, { useEffect } from 'react';
import styles from './Timeline.module.css';

interface TimelineProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total match duration in seconds */
  duration: number;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Called when timeline slider is moved */
  onTimeChange: (time: number) => void;
  /** Called when play/pause button is clicked */
  onPlayPauseToggle: () => void;
}

/**
 * Timeline component for match playback control
 * 
 * Features:
 * - Scrubbing timeline to jump to specific match moments
 * - Play/Pause button for controlling playback
 * - Live time display (current / total)
 * - Speed controls
 * 
 * The component handles:
 * - User scrubbing (jumping to time)
 * - Keyboard shortcuts (spacebar to play/pause)
 * - Time formatting (mm:ss)
 * - Smooth slider interaction
 */
export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  isPlaying,
  onTimeChange,
  onPlayPauseToggle,
}) => {
  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        onPlayPauseToggle();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayPauseToggle]);

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.container}>
      {/* Play/Pause Button */}
      <button
        className={styles.playButton}
        onClick={onPlayPauseToggle}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
      >
        {isPlaying ? (
          // Pause icon
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          // Play icon
          <svg viewBox="0 0 24 24" width="20" height="20">
            <polygon points="5 3 19 12 5 21" />
          </svg>
        )}
      </button>

      {/* Time Display */}
      <div className={styles.timeDisplay}>
        <span className={styles.currentTime}>{formatTime(currentTime)}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.totalTime}>{formatTime(duration)}</span>
      </div>

      {/* Timeline Slider */}
      <div className={styles.sliderContainer}>
        {/* Visual progress bar (background) */}
        <div
          className={styles.progress}
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />

        {/* Input range slider */}
        <input
          type="range"
          className={styles.slider}
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onTimeChange(Number(e.target.value))}
          title={`Timeline: ${formatTime(currentTime)} / ${formatTime(duration)}`}
          aria-label="Match timeline slider"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        />
      </div>

      {/* Status Indicator */}
      <div className={styles.status}>
        {isPlaying ? (
          <>
            <span className={styles.indicator} />
            <span className={styles.statusText}>Playing</span>
          </>
        ) : (
          <span className={styles.statusText}>Paused</span>
        )}
      </div>
    </div>
  );
};

export default Timeline;
