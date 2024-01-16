import useSettings from '@app/hooks/useSettings';

const PrivacyStatement = () => {
  const settings = useSettings();
  const messages = {
    AppTitle: `${settings.currentSettings.applicationTitle}`,
    CompanyTitle: `${settings.currentSettings.companyTitle}`,
  };

  return (
    <div className="text-dark container mb-5">
      <h1 className="text-dark mb-4">Privacy Statement</h1>
      <p>
        This Privacy Statement explains our practices, including your choices,
        regarding the collection, use, and disclosure of certain information,
        including your personal information in connection with the{' '}
        {messages.AppTitle} service.
      </p>
      <h4 className="mt-5">Contacting Us</h4>
      <p>
        If you have general questions about your account or how to contact us
        for assistance, please visit our online help center at
        <a className="text-decoration-none link-purple fw-bold" href="/help">
          {' '}
          {messages.AppTitle}.com/help
        </a>
        . For questions specifically about this Privacy Statement, or our use of
        your personal information, cookies or similar technologies, please
        contact us by email at{' '}
        <a
          className="text-decoration-none link-purple fw-bold"
          href="mailto:privacy@{messages.AppTitle}.com"
        >
          privacy@{messages.AppTitle}.com
        </a>
        .
      </p>
      <p>
        The data controller of your personal information is{' '}
        {messages.CompanyTitle}, Inc.
      </p>
      <h4 className="mt-4">Collection of Information</h4>
      <p>We receive and store information about you such as:</p>
      <ul className="m-3">
        <li>
          <p>
            <strong>information you provide to us:</strong> We collect
            information you provide to us which includes:
          </p>
        </li>
        <ul>
          <li>
            <p>
              your name and email address. We collect this information in a
              number of ways, including when you enter it while using our
              service or interact with us;
            </p>
          </li>
          <li>
            <p>
              information when you choose to provide ratings, taste preferences,
              requests, or otherwise provide information to us through our
              service or elsewhere.
            </p>
          </li>
        </ul>
        <br />
        <li>
          <p>
            <strong>Information we collect automatically:</strong> We collect
            information about you and your use of our service, your interactions
            with us, as well as information regarding your network, network
            devices, and your computer or other {messages.AppTitle} capable
            devices you might use to access our service (such as gaming systems,
            smart TVs, mobile devices, set top boxes, and other streaming media
            devices). This information includes:
          </p>
          <ul>
            <li>
              <p>
                your activity on the {messages.AppTitle} service, such as title
                selections and shows you have watched;
              </p>
            </li>
            <li>
              <p>
                device IDs or other unique identifiers, including for your
                network devices, and devices that are {messages.AppTitle}{' '}
                capable on your Wi-Fi network;
              </p>
            </li>
            <li>
              <p>
                device and software characteristics (such as type and
                configuration), connection information including type (wifi,
                cellular), statistics on page views, referring source (for
                example, referral URLs), IP address (which may tell us your
                general location), browser and standard web server log
                information;
              </p>
            </li>
            <li>
              <p>
                information collected via the use of cookies, web beacons and
                other technologies.
              </p>
            </li>
          </ul>
        </li>
      </ul>
      <h4 className="mt-4">Use of Information</h4>
      <p>
        We use information to provide, analyze, administer, enhance and
        personalize our services, to manage member referrals, to process your
        registration, your requests, and to communicate with you on these and
        other topics. For example, we use such information to:
      </p>
      <ul>
        <li>
          <p>
            determine your general geographic location, provide localized
            content, determine your ISP to support network troubleshooting for
            you (we also use aggregated ISP information for operational and
            business purposes), and help us quickly and efficiently respond to
            inquiries and requests;
          </p>
        </li>
        <li>
          <p>
            secure our systems, prevent fraud and help us protect the security
            of {messages.AppTitle} accounts;
          </p>
        </li>
        <li>
          <p>
            prevent, detect and investigate potentially prohibited or illegal
            activities, including fraud, and to enforce our terms (such as
            determining whether and for which {messages.AppTitle} signup offers
            you are eligible and determining whether a particular device is
            permitted to use the account consistent with our Terms of Use);
          </p>
        </li>
        <li>
          <p>
            analyze and understand our audience, improve our service (including
            our user interface experiences and service performance) and optimize
            content selection, and delivery;
          </p>
        </li>
        <li>
          <p>
            communicate with you concerning our service so that we can send you
            news about {messages.AppTitle}, details about new features and
            content available on {messages.AppTitle}, promotional announcements.
            These communications may be by various methods, such as email, push
            notifications and online messaging channels.
          </p>
        </li>
      </ul>
      <p>
        <strong>Last Updated:</strong> Jan 4, 2024
      </p>
    </div>
  );
};

export default PrivacyStatement;
