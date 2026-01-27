import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  format?: 'number' | 'bytes' | 'speed';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  format = 'number',
  icon,
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'bytes': {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = val;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
      }
      case 'speed': {
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let speed = val;
        let unitIndex = 0;
        while (speed >= 1024 && unitIndex < units.length - 1) {
          speed /= 1024;
          unitIndex++;
        }
        return `${speed.toFixed(2)} ${units[unitIndex]}`;
      }
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral">{title}</p>
            <p className="text-2xl font-bold mt-1">{formatValue(value)}</p>
          </div>
          {icon && <div className="text-primary opacity-50">{icon}</div>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
