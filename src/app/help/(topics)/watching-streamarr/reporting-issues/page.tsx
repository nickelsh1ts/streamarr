'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="reportingissue">
        <FormattedMessage
          id="help.reportingIssues.reportingTitle"
          defaultMessage="Reporting an issue:"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.reportingIssues.step1"
            defaultMessage="Open your {appTitle} account and browse to Seerr"
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
            id="help.reportingIssues.step2"
            defaultMessage="Search for or browse to the media you wish to report"
          />
        </li>
        <li className="flex flex-wrap place-items-center">
          <FormattedMessage
            id="help.reportingIssues.step3"
            defaultMessage="On the Movie or TV Shows discovery page, locate the {icon} icon"
            values={{
              icon: <ExclamationTriangleIcon className="w-6 h-6 mx-1" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.step4"
            defaultMessage="Complete the form with as much detail as possible"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.step5"
            defaultMessage="Click submit issue and close the form"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.reportingIssues.tip1"
            defaultMessage="For playback issues please ensure you select video, audio, or subtitle"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.tip2"
            defaultMessage="If media is missing please select other and describe what or how much is missing"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.tip3"
            defaultMessage="Do not forget to select Season and Episode numbers for shows"
          />
        </li>
      </ul>
      <p className="mb-16">
        <FormattedMessage
          id="help.reportingIssues.detailNote"
          defaultMessage="For the quickest resolution please ensure all fields are accurate and complete. Provide as much detail as possible."
        />
      </p>
      <div className="mt-5 font-extrabold" id="issuetracking">
        <FormattedMessage
          id="help.reportingIssues.trackingTitle"
          defaultMessage="Issue Tracking:"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.reportingIssues.trackStep1"
            defaultMessage="Open your {appTitle} account and browse to Seerr"
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
            id="help.reportingIssues.trackStep2"
            defaultMessage="from the menu options select Issues"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.trackStep3"
            defaultMessage="You can filter all, open or resolved issues"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.trackStep4"
            defaultMessage="Select View Issue to review information submitted"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.reportingIssues.trackTip1"
            defaultMessage="Comments may sometimes be entered asking for further information or to provide updates"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.trackTip2"
            defaultMessage="All issues have a report number associated for clarity and tracking"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.reportingIssues.trackTip3"
            defaultMessage="Further questions can be submitted within each issue"
          />
        </li>
      </ul>
      <p className="">
        <FormattedMessage
          id="help.reportingIssues.privacyNote"
          defaultMessage="Issues reported are not visible to others and only yourself and the {appTitle} admin team have access."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
    </>
  );
};

const anchors = [
  { href: '#reportingissue', title: 'Reporting an Issue' },
  { href: '#issuetracking', title: 'Issue Tracking' },
];

const ReportingIssues = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/reporting-issues"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.reportingIssues.breadcrumb', defaultMessage: 'How can I report an issue with {appTitle} content?' }, { appTitle: currentSettings.applicationTitle })}`}
      />
      <HelpCard
        heading={intl.formatMessage(
          {
            id: 'help.reportingIssues.heading',
            defaultMessage:
              'How can I report an issue with {appTitle} content?',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        subheading={intl.formatMessage({
          id: 'help.reportingIssues.subheading',
          defaultMessage:
            'You can use the Seerr app to report issues with missing or incomplete media as well as issues or difficulty you experience with playback on certain devices.',
        })}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default ReportingIssues;
