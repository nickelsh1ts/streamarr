import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';

const ReportingIssues = () => {
  const settings = useSettings();
  const messages = {
    reportingissues: 'Reporting Issues',
  };

  return (
    <>
      <PageTitle title={messages.reportingissues} />
      <HelpPages>
        <main className="mx-md-5 text-dark mx-2 my-4">
          <div className="border-1 border-purple rounded-3 col col-xl-7 container border p-5 shadow shadow-lg">
            <h3>
              How can I report an issue with{' '}
              {settings.currentSettings.applicationTitle} content?
            </h3>
            <p>
              You can use the Overseerr app to report issues with missing or
              incomplete media as well as issues or difficulty you experience
              with playback on certain devices.
            </p>
            <p className="">
              <a
                className="link-purple text-decoration-none"
                href="#reportingissue"
                title="Reporting an Issue"
              >
                Reporting an issue
              </a>
              <br />
              <a
                className="link-purple text-decoration-none"
                href="#issuetracking"
                title="Issue Tracking"
              >
                Issue Tracking
              </a>
            </p>
            <p className="mt-5">
              <strong id="reportingissue">Reporting an issue:</strong>
            </p>
            <ol className="ms-4">
              <li>
                Open your {settings.currentSettings.applicationTitle} account
                and browse to Overseerr
              </li>
              <li>Search for or browse to the media you wish to report</li>
              <li>
                On the Movie or TV Shows discovery page, locate the{' '}
                <i className="fa-solid fa-triangle-exclamation"></i> icon
              </li>
              <li>Complete the form with as much detail as possible</li>
              <li>Click submit issue and close the form</li>
            </ol>
            <p className="fst-italic">Important Information</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>
                  For playback issues please ensure you select video, audio, or
                  subtitle
                </li>
                <li>
                  If media is missing please select other and describe what or
                  how much is missing
                </li>
                <li>
                  Do not forget to select Season and Episode numbers for shows
                </li>
              </ul>
              For the quickest resolution please ensure all fields are aaccurate
              and complete. Provide as much detail as possible.
            </div>
            <p className="mt-5">
              <strong id="issuetracking">Issue Tracking:</strong>
            </p>
            <ol className="ms-4">
              <li>
                Open your {settings.currentSettings.applicationTitle} account
                and browse to Overseerr
              </li>
              <li>from the menu options select Issues</li>
              <li>You can filter all, open or resolved issues</li>
              <li>Select View Issue to review information submitted</li>
            </ol>
            <p className="fst-italic">Important Information</p>
            <div className="mb-5">
              <ul className="ms-4">
                <li>
                  Comments may sometimes be entered asking for further
                  information or to provide updates
                </li>
                <li>
                  All issues have a report number associated for clearity and
                  tracking
                </li>
                <li>Further questions can be submitted within each issue</li>
              </ul>
              Issues reported are not visable to others and only yourself and
              the {settings.currentSettings.applicationTitle} admin team have
              access.
            </div>
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default ReportingIssues;
