'use client';
import {
  CalendarDateRangeIcon,
  CalendarDaysIcon,
  CalendarIcon,
  QueueListIcon,
} from '@heroicons/react/24/solid';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { useCallback, useEffect } from 'react';
import { Views } from 'react-big-calendar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FormattedMessage } from 'react-intl';
import useLocale from '@app/hooks/useLocale';
import { registerDatePickerLocale } from '@app/utils/datepickerLocale';
import { Permission, useUser } from '@app/hooks/useUser';

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
  setEditEventModal,
}) => {
  const { locale } = useLocale();
  const { hasPermission } = useUser();

  useEffect(() => {
    registerDatePickerLocale(locale);
  }, [locale]);

  const datePickerLocale = locale !== 'en' ? locale : undefined;

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
    <div className="flex flex-grow flex-col-reverse sm:flex-row lg:flex-grow-0 gap-2 p-4 justify-between">
      <div
        id="datePicker"
        className="text-primary flex flex-grow flex-col sm:flex-row lg:flex-grow-0 gap-2"
      >
        {view != Views.WEEK ? (
          <DatePicker
            dateFormat={dateFormat}
            selected={convertUTCToLocalDate(date)}
            locale={datePickerLocale}
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
            locale={datePickerLocale}
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
        {hasPermission([Permission.CREATE_EVENTS, Permission.MANAGE_EVENTS], {
          type: 'or',
        }) && (
          <button
            id="create-event"
            onClick={() => setEditEventModal({ open: true, event: null })}
            className="btn btn-sm btn-primary"
          >
            <FormattedMessage
              id="calendar.createEvent"
              defaultMessage="Create an Event"
            />
          </button>
        )}
      </div>
      <div
        id="view"
        className="flex flex-grow flex-col-reverse sm:flex-row lg:flex-grow-0 gap-2"
      >
        <div className="flex flex-grow sm:mb-0 lg:flex-grow-0">
          <button
            id="previous"
            onClick={onPrev}
            className="btn btn-sm btn-primary rounded-r-none flex-1 basis-1/5"
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
            className="btn btn-sm btn-primary rounded-none flex-1 basis-1/2"
          >
            <FormattedMessage id="calendar.today" defaultMessage="Today" />
          </button>
          <button
            id="next"
            onClick={onNext}
            className="btn btn-sm btn-primary rounded-s-none flex-1 basis-1/5"
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
        <div className="flex flex-grow sm:mb-0 lg:flex-grow-0">
          <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm text-primary-content">
            {view === 'month' ? (
              <CalendarIcon className="size-6" />
            ) : view === 'week' ? (
              <CalendarDateRangeIcon className="size-6" />
            ) : view === 'day' ? (
              <CalendarDaysIcon className="size-6" />
            ) : (
              <QueueListIcon className="size-6" />
            )}
          </span>
          <select
            id="view"
            onChange={(view) => setView(view.target.value)}
            value={view}
            className="select select-sm select-primary rounded-md rounded-l-none flex-1"
          >
            <option value="month">
              <FormattedMessage id="calendar.month" defaultMessage="Month" />
            </option>
            <option value="week">
              <FormattedMessage id="calendar.week" defaultMessage="Week" />
            </option>
            <option value="day">
              <FormattedMessage id="calendar.day" defaultMessage="Day" />
            </option>
            <option value="agenda">
              <FormattedMessage id="calendar.agenda" defaultMessage="Agenda" />
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};
export default CalendarToolBar;
