import React from 'react';
import { formatBytes, formatSpeed } from '@app/utils/numberHelper';

interface StatsCardProps {
  title: string;
  value: number;
  format?: 'number' | 'bytes' | 'speed';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  format = 'number',
  icon,
  badge,
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'bytes':
        return formatBytes(val);
      case 'speed':
        return formatSpeed(val);
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-neutral">{title}</p>
              {badge}
            </div>
            <p className="text-2xl font-bold mt-1">{formatValue(value)}</p>
          </div>
          {icon && <div className="text-primary opacity-50">{icon}</div>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
