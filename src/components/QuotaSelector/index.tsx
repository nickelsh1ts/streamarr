import React, { useEffect, useState } from 'react';

interface QuotaSelectorProps {
  defaultDays?: number;
  defaultLimit?: number;
  dayOverride?: number;
  limitOverride?: number;
  dayFieldName: string;
  limitFieldName: string;
  isDisabled?: boolean;
  onChange: (fieldName: string, value: number) => void;
}

const QuotaSelector = ({
  dayFieldName,
  limitFieldName,
  defaultDays = 7,
  defaultLimit = 0,
  dayOverride,
  limitOverride,
  isDisabled = false,
  onChange,
}: QuotaSelectorProps) => {
  const initialDays = defaultDays ?? 7;
  const initialLimit = defaultLimit ?? 0;
  const [quotaDays, setQuotaDays] = useState(initialDays);
  const [quotaLimit, setQuotaLimit] = useState(initialLimit);

  useEffect(() => {
    onChange(dayFieldName, quotaDays);
  }, [dayFieldName, onChange, quotaDays]);

  useEffect(() => {
    onChange(limitFieldName, quotaLimit);
  }, [limitFieldName, onChange, quotaLimit]);

  return (
    <div className={`${isDisabled ? 'opacity-50' : ''}`}>
      <span className="flex space-x-4">
        <select
          className="select select-sm select-primary rounded-md disabled:border disabled:border-primary"
          value={limitOverride ?? quotaLimit}
          onChange={(e) => setQuotaLimit(Number(e.target.value))}
          disabled={isDisabled}
        >
          <option value="-1">Unlimited</option>
          <option value="0">None</option>
          {[...Array(100)].map((_item, i) => (
            <option value={i + 1} key={`$invite-limit-${i + 1}`}>
              {i + 1}
            </option>
          ))}
        </select>
        <span>
          {quotaLimit > 1
            ? 'invites per'
            : quotaLimit < 0
              ? 'invites'
              : quotaLimit === 0
                ? ''
                : 'invite per'}
        </span>
        {quotaLimit > 0 && (
          <>
            <select
              className="select select-sm select-primary rounded-md disabled:border disabled:border-primary"
              value={dayOverride ?? quotaDays}
              onChange={(e) => setQuotaDays(Number(e.target.value))}
              disabled={isDisabled}
            >
              <option value="0">Life time</option>
              {[...Array(100)].map((_item, i) => (
                <option value={i + 1} key={`invite-days-${i + 1}`}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span>{quotaDays > 0 && `day${quotaDays > 1 ? 's' : ''}`}</span>
          </>
        )}
      </span>
    </div>
  );
};

export default React.memo(QuotaSelector);
