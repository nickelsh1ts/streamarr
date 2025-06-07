const Privacy = () => {
  return (
    <div className="container my-5 text-black max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto p-4">
      <p className="text-4xl mb-6 font-extrabold">Privacy Statement</p>
      <p>
        This Privacy Statement explains our practices, including your choices,
        regarding the collection, use, and disclosure of certain information,
        including your personal information in connection with the{' '}
        {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        service.
      </p>
      <p className="font-extrabold mt-10 text-xl mb-2">Contacting Us</p>
      <p>
        If you have general questions about your account or how to contact us
        for assistance, please visit our online help center at
        <a
          className="text-decoration-none link-primary font-extrabold"
          href="/help"
        >
          {' '}
          {process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}
          .com/help
        </a>
        . For questions specifically about this Privacy Statement, or our use of
        your personal information, cookies or similar technologies, please
        contact us by email at{' '}
        <a
          className="text-decoration-none link-primary font-extrabold"
          href={`mailto:privacy@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.com`}
        >
          privacy@
          {process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.com
        </a>
        .
      </p>
      <p className="mt-6">
        The data controller of your personal information is nickelsh1ts, Inc.
      </p>
      <p className="font-extrabold mt-7 text-xl mb-2">
        Collection of Information
      </p>
      <p>We receive and store information about you such as:</p>
      <ul className="list-disc mx-10 my-3">
        <li>
          <span className="font-extrabold">information you provide to us:</span>{' '}
          We collect information you provide to us which includes:
        </li>
        <ul className="list-circle mx-5">
          <li className="my-5">
            your name and email address. We collect this information in a number
            of ways, including when you enter it while using our service or
            interact with us;
          </li>
          <li className="my-5">
            information when you choose to provide ratings, taste preferences,
            requests, or otherwise provide information to us through our service
            or elsewhere.
          </li>
        </ul>

        <li>
          <span className="font-extrabold">
            Information we collect automatically:
          </span>{' '}
          We collect information about you and your use of our service, your
          interactions with us, as well as information regarding your network,
          network devices, and your computer or other{' '}
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'} capable devices you
          might use to access our service (such as gaming systems, smart TVs,
          mobile devices, set top boxes, and other streaming media devices).
          This information includes:
        </li>
        <ul className="list-circle mx-5">
          <li className="my-5">
            your activity on the{' '}
            {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'} service, such as
            title selections and shows you have watched;
          </li>
          <li className="my-5">
            device IDs or other unique identifiers, including for your network
            devices, and devices that are{' '}
            {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'} capable on your
            Wi-Fi network;
          </li>
          <li className="my-5">
            device and software characteristics (such as type and
            configuration), connection information including type (wifi,
            cellular), statistics on page views, referring source (for example,
            referral URLs), IP address (which may tell us your general
            location), browser and standard web server log information;
          </li>
          <li className="my-5">
            information collected via the use of cookies, web beacons and other
            technologies.
          </li>
        </ul>
      </ul>
      <p className="font-extrabold mt-7 text-xl mb-2">Use of Information</p>
      We use information to provide, analyze, administer, enhance and
      personalize our services, to manage member referrals, to process your
      registration, your requests, and to communicate with you on these and
      other topics. For example, we use such information to:
      <ul className="list-disc mx-10 my-3">
        <li className="my-5">
          determine your general geographic location, provide localized content,
          determine your ISP to support network troubleshooting for you (we also
          use aggregated ISP information for operational and business purposes),
          and help us quickly and efficiently respond to inquiries and requests;
        </li>
        <li className="my-5">
          secure our systems, prevent fraud and help us protect the security of
          [process.env.NEXT_PUBLIC_APP_NAME] accounts;
        </li>
        <li className="my-5">
          prevent, detect and investigate potentially prohibited or illegal
          activities, including fraud, and to enforce our terms (such as
          determining whether and for which{' '}
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'} signup offers you
          are eligible and determining whether a particular device is permitted
          to use the account consistent with our Terms of Use);
        </li>
        <li className="my-5">
          analyze and understand our audience, improve our service (including
          our user interface experiences and service performance) and optimize
          content selection, and delivery;
        </li>
        <li className="my-5">
          communicate with you concerning our service so that we can send you
          news about {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}, details
          about new features and content available on{' '}
          {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}, promotional
          announcements. These communications may be by various methods, such as
          email, push notifications and online messaging channels.
        </li>
      </ul>
      <span className="font-extrabold">Last Updated:</span> July 12, 2024
    </div>
  );
};

export default Privacy;
