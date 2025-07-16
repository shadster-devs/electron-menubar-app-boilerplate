import React from 'react';
import './ProgressBar.css';

export interface ProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  height?: string;
  backgroundColor?: string;
  fillColor?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  height = '4px',
  backgroundColor = 'var(--border-light)',
  fillColor = 'var(--accent-primary)',
  className = '',
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`progress-bar-container ${className}`}>
      <div
        className='progress-bar-track'
        style={{
          height,
          backgroundColor,
        }}
      >
        <div
          className='progress-bar-fill'
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: fillColor,
            height: '100%',
          }}
        />
      </div>
      {showPercentage && (
        <div className='progress-bar-label'>
          {Math.round(clampedProgress)}% complete
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
