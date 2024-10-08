import moment from 'moment';
import { useCallback } from 'react';
import { Views } from 'react-big-calendar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function convertUTCToLocalDate(date) {
  if (!date) {
    return date;
  }
  date = new Date(date);
  date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return date;
}

const CalendarToolBar = ({
  dateText,
  date,
  setDate,
  view,
  endOfWeek,
  startOfWeek,
  oneMonth,
  setView,
}) => {
  let dateFormat = '';
  const to = ' - ';
  if (view === 'month') {
    dateFormat = 'MMMM YYYY';
  }
  if (view === 'week') {
    dateFormat = 'MMMM dd';
  }
  if (view === 'day') {
    dateFormat = ' EEEE, LLLL dd';
  }
  if (view === 'agenda') {
    dateFormat = 'M/dd/YYYY' + to + oneMonth;
  }

  const onNext = useCallback(() => {
    if (view === Views.DAY) {
      setDate(moment(date).add(1, 'd').toDate());
    }
    if (view === Views.WEEK) {
      setDate(moment(date).add(1, 'w').toDate());
    }
    if (view === Views.MONTH) {
      setDate(moment(date).add(1, 'M').toDate());
    }
    if (view === Views.AGENDA) {
      setDate(moment(date).add(30, 'd').toDate());
    }
  }, [date, setDate, view]);

  const onPrev = useCallback(() => {
    if (view === Views.DAY) {
      setDate(moment(date).subtract(1, 'd').toDate());
    }
    if (view === Views.WEEK) {
      setDate(moment(date).subtract(1, 'w').toDate());
    }
    if (view === Views.MONTH) {
      setDate(moment(date).subtract(1, 'M').toDate());
    }
    if (view === Views.AGENDA) {
      setDate(moment(date).subtract(30, 'd').toDate());
    }
  }, [date, setDate, view]);

  return (
    <div className="max-w-screen-xl px-2 my-2 mx-auto">
      <div className="flex flex-wrap place-content-between gap-2">
        <div id="datePicker" className="text-primary">
          {view != Views.WEEK ? (
            <DatePicker
              dateFormat={dateFormat}
              selected={convertUTCToLocalDate(date)}
              showIcon
              toggleCalendarOnIconClick
              closeOnScroll
              placeholderText={dateText}
              onChange={(date: Date) =>
                date ? setDate(convertUTCToLocalDate(date)) : null
              }
              showYearDropdown
              yearDropdownItemNumber={2}
              scrollableYearDropdown
              showMonthDropdown
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className=""
                >
                  <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                  <path
                    fillRule="evenodd"
                    d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          ) : (
            <DatePicker
              dateFormat={dateFormat}
              selected={date}
              startDate={startOfWeek}
              endDate={endOfWeek}
              showIcon
              toggleCalendarOnIconClick
              closeOnScroll
              placeholderText={dateText}
              onChange={(dates) => {
                const [start] = dates;
                setDate(start);
              }}
              showYearDropdown
              yearDropdownItemNumber={2}
              scrollableYearDropdown
              showMonthDropdown
              showWeekPicker
              selectsRange
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className=""
                >
                  <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                  <path
                    fillRule="evenodd"
                    d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          )}
        </div>
        <div id="view" className="flex place-items-center gap-2">
          <div className="place-content-center flex">
            <button
              id="previous"
              onClick={onPrev}
              className="btn btn-sm btn-primary rounded-r-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              id="today"
              onClick={() => setDate(moment().toDate())}
              className="btn btn-sm btn-primary rounded-none"
            >
              Today
            </button>
            <button
              id="next"
              onClick={onNext}
              className="btn btn-sm btn-primary rounded-s-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="flex">
            <select
              id="view"
              onChange={(view) => setView(view.target.value)}
              value={view}
              className="select select-sm select-primary w-full max-w-xs"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CalendarToolBar;
