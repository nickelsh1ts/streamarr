import PropTypes from 'prop-types';
import moment from 'moment';
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
      <div className="my-3 mx-auto max-w-screen-xl px-2 flex justify-end">
        {title ? <strong style={{ marginBottom: 10 }}>{title}</strong> : null}
        <select
          className="select select-bordered select-primary select-sm bg-base-200 max-w-56 text-ellipsis"
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
