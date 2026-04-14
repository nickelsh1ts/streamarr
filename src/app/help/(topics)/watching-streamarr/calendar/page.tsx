'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage, useIntl } from 'react-intl';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="overview">
        <FormattedMessage
          id="help.calendar.overviewTitle"
          defaultMessage="Release Schedule Overview"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.calendar.overviewDesc"
          defaultMessage="The {appTitle} calendar shows you upcoming releases for movies and TV shows that are being tracked by the service. This includes media that has been requested and approved, as well as content already in the library that has new seasons or episodes coming."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.calendar.viewUpcoming"
            defaultMessage="View upcoming movie release dates and TV episodes at a glance"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.calendar.seeAvailable"
            defaultMessage="See when new content will be available to watch on {appTitle}"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.calendar.planViewing"
            defaultMessage="Plan your viewing around upcoming releases"
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="using-calendar">
        <FormattedMessage
          id="help.calendar.usingTitle"
          defaultMessage="Using the Calendar"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.calendar.usingDesc"
          defaultMessage="Access the calendar from the navigation menu. You can browse through different dates to see what content is coming up."
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.calendar.navigateMonths"
            defaultMessage="Navigate between months to see upcoming and past releases"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.calendar.selectTitle"
            defaultMessage="Select a title to view more details about the release"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.calendar.autoUpdate"
            defaultMessage="The calendar is automatically updated as new content is tracked"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.calendar.tmdbTip"
          defaultMessage="Release dates are sourced from TMDB and may occasionally change. The calendar updates automatically when dates are adjusted."
        />
      </p>
    </>
  );
};

const anchors = [
  { href: '#overview', title: 'Overview' },
  { href: '#using-calendar', title: 'Using the Calendar' },
];

const Calendar = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/calendar"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.calendar.breadcrumb', defaultMessage: 'Calendar & Release Schedule' })}`}
      />
      <HelpCard
        heading={intl.formatMessage({
          id: 'help.calendar.heading',
          defaultMessage: 'Calendar & release schedule',
        })}
        subheading={intl.formatMessage(
          {
            id: 'help.calendar.subheading',
            defaultMessage:
              'Keep track of upcoming movie and TV show releases on {appTitle} with the built-in release calendar.',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default Calendar;
