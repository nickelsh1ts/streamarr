import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

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
          <option value="-1">
            <FormattedMessage
              id="common.unlimited"
              defaultMessage="Unlimited"
            />
          </option>
          <option value="0">
            <FormattedMessage id="common.none" defaultMessage="None" />
          </option>
          {[...Array(100)].map((_item, i) => (
            <option value={i + 1} key={`$invite-limit-${i + 1}`}>
              {i + 1}
            </option>
          ))}
        </select>
        <span>
          {quotaLimit > 0 ? (
            <FormattedMessage
              id="quotaSelector.invitesPerPeriod"
              defaultMessage="{count, plural, one {invite per} other {invites per}}"
              values={{ count: quotaLimit }}
            />
          ) : quotaLimit < 0 ? (
            <FormattedMessage id="common.invites" defaultMessage="invites" />
          ) : (
            ''
          )}
        </span>
        {quotaLimit > 0 && (
          <>
            <select
              className="select select-sm select-primary rounded-md disabled:border disabled:border-primary"
              value={dayOverride ?? quotaDays}
              onChange={(e) => setQuotaDays(Number(e.target.value))}
              disabled={isDisabled}
            >
              <option value="0">
                <FormattedMessage
                  id="common.lifetime"
                  defaultMessage="Life time"
                />
              </option>
              {[...Array(100)].map((_item, i) => (
                <option value={i + 1} key={`invite-days-${i + 1}`}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span>
              {quotaDays > 0 && (
                <FormattedMessage
                  id="invite.timeUnit.day"
                  defaultMessage="{count, plural, one {day} other {days}}"
                  values={{ count: quotaDays }}
                />
              )}
            </span>
          </>
        )}
      </span>
    </div>
  );
};

export default React.memo(QuotaSelector);
