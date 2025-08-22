'use client';
import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import type { View } from 'react-big-calendar';
import {
  Calendar,
  momentLocalizer,
  Views,
  DateLocalizer,
} from 'react-big-calendar';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import 'moment-timezone';
import TimezoneSelect from './TimezoneSelect';
import './index.css';
import CalendarToolBar from '@app/components/Common/BigCalendar/CalendarToolBar';
import { useIntl } from 'react-intl';
import EventModal from '@app/components/Common/BigCalendar/EventModal';
import axios from 'axios';
import type { User } from '@server/entity/User';

export interface eventProps {
  id: number;
  uid: string;
  title: string;
  subtitle?: string;
  start: Date;
  end: Date;
  description?: string;
  type?: string;
  categories?: string[] | string;
  status?: string;
  allDay?: boolean;
  createdBy?: User;
}

interface BigCalendarProps {
  events: eventProps[];
  revalidateEvents: () => void;
}

const defaultTZ = moment.tz.guess();
const defaultDateStr = moment().toDate();

function getDate(str, momentObj) {
  return momentObj(str, 'YYYY-MM-DD').toDate();
}

export default function BigCalendar({
  events,
  revalidateEvents,
}: BigCalendarProps) {
  const intl = useIntl();
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [timezone, setTimezone] = useState(defaultTZ);

  const [date, setDate] = useState(defaultDateStr);
  const [view, setView] = useState<View>(Views.MONTH);

  const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
  const onView = useCallback((newView) => setView(newView), [setView]);

  // Restore last set view values on component mount
  useEffect(() => {
    const viewString = window.localStorage.getItem('schedule-view-settings');
    if (viewString) {
      const viewSettings = JSON.parse(viewString);
      setView(viewSettings.view);
      setTimezone(viewSettings.timezone || defaultTZ);
    }
    setHasLoadedSettings(true);
  }, []);

  // Set view values to local storage any time they are changed
  useEffect(() => {
    if (!hasLoadedSettings) return;
    window.localStorage.setItem(
      'schedule-view-settings',
      JSON.stringify({
        view,
        timezone,
      })
    );
  }, [view, hasLoadedSettings, timezone]);

  const { defaultDate, getNow, localizer, myEvents, scrollToTime } =
    useMemo(() => {
      moment.tz.setDefault(timezone);
      return {
        defaultDate: getDate(defaultDateStr, moment),
        getNow: () => moment().toDate(),
        localizer: momentLocalizer(moment),
        myEvents: events,
        scrollToTime: moment().toDate(),
      };
    }, [events, timezone]);

  useEffect(() => {
    return () => {
      moment.tz.setDefault();
    };
  }, []);

  const { messages } = useMemo(
    () => ({
      messages: {
        event: intl.formatMessage({
          id: 'calendar.event',
          defaultMessage: 'New Release or Event',
        }),
        time: intl.formatMessage({
          id: 'calendar.time',
          defaultMessage: 'Time',
        }),
        date: intl.formatMessage({
          id: 'calendar.date',
          defaultMessage: 'Date',
        }),
      },
    }),
    [intl]
  );

  const clickRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(clickRef?.current);
    };
  }, []);

  const onDrillDown = useCallback(
    (newDate) => {
      setDate(newDate);
      setView(Views.DAY);
    },
    [setDate, setView]
  );

  const [editEventModal, setEditEventModal] = useState<{
    open: boolean;
    selectedEvent: eventProps | null;
  }>({
    open: false,
    selectedEvent: null,
  });

  const onSelectEvent = useCallback((calEvent: eventProps) => {
    window.clearTimeout(clickRef?.current);
    clickRef.current = window.setTimeout(() => {
      setEditEventModal({ open: true, selectedEvent: calEvent });
    }, 250);
  }, []);

  const onDoubleClickEvent = useCallback((calEvent) => {
    window.clearTimeout(clickRef?.current);
    clickRef.current = window.setTimeout(() => {
      window.alert(calEvent);
    }, 250);
  }, []);

  const dateText = useMemo(() => {
    if (view === Views.DAY) return moment(date).format('dddd, MMMM DD');
    if (view === Views.WEEK) {
      const from = moment(date)?.startOf('week');
      const to = moment(date)?.endOf('week');
      if (from.month() === to.month()) {
        return `${from.format('MMMM DD')} - ${to.format('DD')}`;
      } else return `${from.format('MMMM DD')} - ${to.format('MMMM DD')}`;
    }
    if (view === Views.MONTH) {
      return moment(date).format('MMMM YYYY');
    }
    if (view === Views.AGENDA) {
      const from = moment(date);
      const to = moment(date).add(30, 'days');
      return `${from.format('M/DD/YYYY')} to ${to.format('M/DD/YYYY')}`;
    }
  }, [view, date]);

  const calendarToolbarProps = useMemo(
    () => ({
      oneMonth: moment(date).add(30, 'days').format('M/DD/YYYY'),
      startOfWeek: moment(date)?.startOf('week').format('MMMM DD'),
      endOfWeek: moment(date)?.endOf('week').format('MMMM DD'),
      view,
      setDate,
      date,
      dateText,
      setView,
      setEditEventModal,
    }),
    [date, view, setDate, setView, dateText]
  );

  const modalSubtitle = useMemo(() => {
    if (!editEventModal.selectedEvent) return '';
    const isRadarr = editEventModal.selectedEvent.type === 'movie';
    const isSonarr = editEventModal.selectedEvent.type === 'show';
    const startMoment = moment(editEventModal.selectedEvent.start);
    const endMoment = moment(editEventModal.selectedEvent.end);
    const isAllDayRadarr =
      isRadarr && endMoment.diff(startMoment, 'days') === 1;
    if (isAllDayRadarr) {
      return startMoment.format('dddd, MMMM DD');
    }
    if (isSonarr) {
      const dateStr = startMoment.format('dddd, MMMM DD');
      const startTime = startMoment.format('h:mm A');
      const endTime = endMoment.format('h:mm A');
      return `${dateStr} ${startTime} to ${endTime}`;
    }
    if (editEventModal.selectedEvent.allDay) {
      return startMoment.format('dddd, MMMM DD');
    }
    const startDate = startMoment.format('dddd, MMMM DD h:mm A');
    const endDate = endMoment.format('dddd, MMMM DD h:mm A');
    return `${startDate} to ${endDate}`;
  }, [editEventModal.selectedEvent]);

  const deleteEvent = async () => {
    await axios.delete(
      `/api/v1/calendar/local/${editEventModal.selectedEvent?.id}`
    );
    setEditEventModal({ open: false, selectedEvent: null });
    revalidateEvents();
  };

  return (
    <Fragment>
      <CalendarToolBar {...calendarToolbarProps} />
      <div
        className={`px-4 ${view != Views.AGENDA ? 'h-[calc(100dvh-28rem)] min-h-80 sm:h-[calc(100dvh-16rem)] sm:min-h-[30rem]' : ''}`}
      >
        <Calendar
          defaultDate={defaultDate}
          defaultView={Views.MONTH}
          events={myEvents}
          getNow={getNow}
          localizer={localizer}
          scrollToTime={scrollToTime}
          popup
          timeslots={2}
          step={30}
          dayLayoutAlgorithm={'no-overlap'}
          onNavigate={onNavigate}
          onView={onView}
          view={view}
          date={date}
          onSelectEvent={(e) => onSelectEvent(e)}
          onDoubleClickEvent={onDoubleClickEvent}
          messages={messages}
          drilldownView={Views.DAY}
          length={30}
          onDrillDown={onDrillDown}
          toolbar={false}
        />
        <EventModal
          selectedEvent={editEventModal.selectedEvent}
          open={editEventModal.open}
          onClose={() =>
            setEditEventModal({ selectedEvent: null, open: false })
          }
          subtitle={modalSubtitle}
          onDelete={() => deleteEvent()}
          onSave={() => {
            revalidateEvents();
            setEditEventModal({ selectedEvent: null, open: false });
          }}
        />
      </div>
      <TimezoneSelect
        defaultTZ={defaultTZ}
        setTimezone={setTimezone}
        timezone={timezone}
        title={undefined}
      />
    </Fragment>
  );
}
BigCalendar.propTypes = {
  localizer: PropTypes.instanceOf(DateLocalizer),
  events: PropTypes.array,
};
