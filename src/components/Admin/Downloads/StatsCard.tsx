import { formatBytes, formatSpeed } from '@app/utils/numberHelper';
import React from 'react';

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
              <p className="text-neutral text-sm">{title}</p>
              {badge}
            </div>
            <p className="mt-1 text-2xl font-bold">{formatValue(value)}</p>
          </div>
          {icon && <div className="text-primary opacity-50">{icon}</div>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
