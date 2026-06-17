import { momentWithLocale as moment } from '@app/utils/momentLocale';
import 'moment-timezone';
import PropTypes from 'prop-types';

const allZones = moment.tz.names();

export default function TimezoneSelect({
  title,
  defaultTZ = moment.tz.guess(),
  timezone,
  setTimezone,
}) {
  const onChange = ({ target: { value } }) =>
    setTimezone(value ? value : defaultTZ);

  return (
    <div>
      <div className="my-3 flex justify-end px-4">
        {title ? <strong style={{ marginBottom: 10 }}>{title}</strong> : null}
        <select
          className="select select-primary select-sm bg-base-200 text-ellipsis max-sm:flex-1"
          value={timezone}
          onChange={onChange}
        >
          {allZones.map((c, idx) => (
            <option className="" key={idx} value={c}>
              {c.replace(/_+/g, ' ')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

TimezoneSelect.propTypes = {
  title: PropTypes.string,
  defaultTZ: PropTypes.string,
  timezone: PropTypes.string,
  setTimezone: PropTypes.func,
};
