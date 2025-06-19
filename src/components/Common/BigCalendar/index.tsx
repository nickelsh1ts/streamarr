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
import {
  Calendar,
  momentLocalizer,
  Views,
  DateLocalizer,
} from 'react-big-calendar';
import moment from 'moment';
import 'moment-timezone';
import TimezoneSelect from './TimezoneSelect';
import './index.css';
import CalendarToolBar from '@app/components/Common/BigCalendar/CalendarToolBar';
import Modal from '@app/components/Common/Modal';
import events from './DemoData';

interface eventProps {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

const defaultTZ = moment.tz.guess();
const defaultDateStr = moment().toDate();

function getDate(str, momentObj) {
  return momentObj(str, 'YYYY-MM-DD').toDate();
}

export default function BigCalendar({
  ReleaseEvents = events,
}: {
  ReleaseEvents?: typeof events;
}) {
  const [timezone, setTimezone] = useState(defaultTZ);

  const [date, setDate] = useState(defaultDateStr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [view, setView] = useState<any>(Views.MONTH);

  const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
  const onView = useCallback((newView) => setView(newView), [setView]);

  const { defaultDate, getNow, localizer, myEvents, scrollToTime } =
    useMemo(() => {
      moment.tz.setDefault(timezone);
      return {
        defaultDate: getDate(defaultDateStr, moment),
        getNow: () => moment().toDate(),
        localizer: momentLocalizer(moment),
        myEvents: ReleaseEvents,
        scrollToTime: moment().toDate(),
      };
    }, [ReleaseEvents, timezone]);

  useEffect(() => {
    return () => {
      moment.tz.setDefault();
    };
  }, []);

  const { messages } = useMemo(
    () => ({
      messages: {
        event: 'New Release or Event',
      },
    }),
    []
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

  const [selectedEvent, setSelectedEvent] = useState<eventProps | undefined>(
    undefined
  );
  const [modalState, setModalState] = useState(false);

  const onSelectEvent = useCallback((calEvent: eventProps) => {
    window.clearTimeout(clickRef?.current);
    clickRef.current = window.setTimeout(() => {
      setSelectedEvent(calEvent);
      setModalState(true);
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
    }),
    [date, view, setDate, setView, dateText]
  );

  const modalSubtitle = useMemo(
    () =>
      selectedEvent
        ? `${moment(selectedEvent?.start).format('dddd, MMMM DD h:mm A')} to ${moment(selectedEvent?.end).format('dddd, MMMM DD h:mm A')}`
        : '',
    [selectedEvent]
  );

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
        <Modal
          onClose={() => {
            setModalState(false);
          }}
          title={selectedEvent?.title}
          subtitle={modalSubtitle}
          show={modalState}
          content={'THIS IS MY CONTENT'}
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
};
