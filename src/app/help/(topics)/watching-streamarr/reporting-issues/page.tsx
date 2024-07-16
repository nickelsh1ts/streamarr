import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const HelpContent = () => {
  return (
    <>
      <div className="mt-5 font-extrabold" id="reportingissue">
        Reporting an issue:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>Open your Streamarr account and browse to Overseerr</li>
        <li>Search for or browse to the media you wish to report</li>
        <li className="flex flex-wrap place-items-center">
          On the Movie or TV Shows discovery page, locate the
          <ExclamationTriangleIcon className="w-6 h-6 mx-1" /> icon
        </li>
        <li>Complete the form with as much detail as possible</li>
        <li>Click submit issue and close the form</li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          For playback issues please ensure you select video, audio, or subtitle
        </li>
        <li>
          If media is missing please select other and describe what or how much
          is missing
        </li>
        <li>Do not forget to select Season and Episode numbers for shows</li>
      </ul>
      <p className="mb-16">
        For the quickest resolution please ensure all fields are aaccurate and
        complete. Provide as much detail as possible.
      </p>
      <div className="mt-5 font-extrabold" id="issuetracking">
        Issue Tracking:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>Open your Streamarr account and browse to Overseerr</li>
        <li>from the menu options select Issues</li>
        <li>You can filter all, open or resolved issues</li>
        <li>Select View Issue to review information submitted</li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          Comments may sometimes be entered asking for further information or to
          provide updates
        </li>
        <li>
          All issues have a report number associated for clarity and tracking
        </li>
        <li>Further questions can be submitted within each issue</li>
      </ul>
      <p className="mb-16">
        Issues reported are not visible to others and only yourself and the
        Streamarr admin team have access.
      </p>
    </>
  );
};

const anchors = [
  {
    href: '#reportingissue',
    title: 'Reporting an Issue',
  },
  {
    href: '#issuetracking',
    title: 'Issue Tracking',
  },
];

const ReportingIssues = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/reporting-issues"
        homeElement={'Help Centre'}
        names="Watching Streamarr,How can I report an issue with Streamarr content?"
      />
      <HelpCard
        heading="How can I report an issue with Streamarr content?"
        subheading="You can use the Overseerr app to report issues with missing or incomplete media as well as issues or difficulty you experience with playback on certain devices."
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default ReportingIssues;
