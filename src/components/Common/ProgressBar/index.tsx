import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  size = 'md',
  color = 'primary',
  showPercentage = true,
  animated = false,
  className = '',
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  const bgClasses = {
    primary: 'bg-primary/20 dark:bg-primary/40',
    success: 'bg-success/20 dark:bg-success/40',
    warning: 'bg-warning/20 dark:bg-warning/40',
    danger: 'bg-danger/20 dark:bg-danger/40',
    info: 'bg-info/20 dark:bg-info/40',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label && <span className="text-neutral">{label}</span>}
          {showPercentage && (
            <span className="font-medium text-neutral">
              {clampedProgress.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full ${bgClasses[color]} ${sizeClasses[size]}`}
      >
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} transition-all duration-300 ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
