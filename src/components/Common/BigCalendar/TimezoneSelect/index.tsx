import PropTypes from 'prop-types';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import 'moment-timezone';

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
      <div className="my-3 px-4 flex justify-end">
        {title ? <strong style={{ marginBottom: 10 }}>{title}</strong> : null}
        <select
          className="select select-bordered select-primary select-sm bg-base-200 text-ellipsis max-sm:flex-1"
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
