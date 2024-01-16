import useSettings from '@app/hooks/useSettings';

const TermsStatement = () => {
  const settings = useSettings();
  const messages = {
    AppTitle: `${settings.currentSettings.applicationTitle}`,
  };

  return (
    <div className="text-dark container mb-5">
      <h1 className="text-dark mb-5">{messages.AppTitle} Terms of Use</h1>
      <div>
        <p>
          {messages.AppTitle} provides a personalized subscription service that
          allows our members to access movies and TV shows (“{messages.AppTitle}{' '}
          content”) streamed over the Internet to certain Internet-connected
          TVs, computers and other devices (&quot;Plex&trade; ready
          devices&quot;).
        </p>
        <p>
          These Terms of Use govern your use of our service. As used in these
          Terms of Use, &quot;{messages.AppTitle} service&quot;, &quot;our
          service&quot; or &quot;the service&quot; means the personalized
          service provided by {messages.AppTitle} for discovering and watching{' '}
          {messages.AppTitle} content, including all features and
          functionalities, recommendations and reviews, the website, and user
          interfaces, as well as all content and software associated with our
          service.
        </p>
        <ul>
          <li>
            <p>
              <strong>Membership</strong>
              <br />
              <br />
              1.1. Your {messages.AppTitle} membership will continue until
              terminated. To use the {messages.AppTitle} service you must have
              Internet access and a Plex&trade; ready device.
              <br />
              <br />
              1.2. We may offer a number of memberships offered by third parties
              in conjunction with the provision of their own products and
              services. We are not responsible for the products and services
              provided by such third parties.
              <br />
            </p>
          </li>
          <li>
            <p>
              <strong>Cancellation</strong>
              <br />
              <br />
              2.1. You can cancel your {messages.AppTitle} membership at any
              time, and you will lose access to {messages.AppTitle} service
              immediately. To cancel, go to the &quot;Users and Sharing&quot;
              page on Plex&trade; and follow the instructions to remove the{' '}
              {messages.AppTitle} Server. If you cancel your membership, your
              account will automatically close.
              <br />
              <br />
              2.2. You can cancel your Plex account at anytime, and are subject
              to their own terms and conditions. To cancel go to your
              &quot;Account&quot; page on Plex&trade; and follow the
              instructions to delete your account.
            </p>
          </li>
          <li>
            <p>
              <strong>{messages.AppTitle} Service</strong>
              <br />
              <br />
              3.1. The {messages.AppTitle} service and any content viewed
              through the service are for your personal and non-commercial use
              only and may not be shared with individuals beyond your household.
              During your
              {messages.AppTitle} membership we grant you a limited,
              non-exclusive, non-transferable right to access the{' '}
              {messages.AppTitle} service and view
              {messages.AppTitle} content. Except for the foregoing, no right,
              title or interest shall be transferred to you. You agree not to
              use the service for public performances.
              <br />
              <br />
              3.2. You may view the {messages.AppTitle} content primarily within
              North America. The content that may be available to watch outside,
              will be restricted. The number of devices on which you may
              simultaneously watch is limited to 2.
              <br />
              <br />
              3.3. The {messages.AppTitle} service, including the content
              library, is regularly updated. In addition, we continually test
              various aspects of our service, including our website, user
              interfaces, and availability of {messages.AppTitle} content.
              <br />
              <br />
              3.4. {messages.AppTitle} content is available for temporary
              download and offline viewing on certain supported devices.
              Limitations apply, including restrictions on the number of Offline
              Titles per account, the maximum number of devices that can contain
              Offline Titles, the time period within which you will need to
              begin viewing Offline Titles and how long the Offline Titles will
              remain accessible.
              <br />
              <br />
              3.5. You agree to use the {messages.AppTitle} service, including
              all features and functionalities associated therewith, in
              accordance with all applicable laws, rules and regulations, or
              other restrictions on use of the service or content therein. You
              agree not to archive, reproduce, distribute, modify, display,
              perform, publish, license, create derivative works from, offer for
              sale, or use (except as explicitly authorized in these Terms of
              Use) content and information contained on or obtained from or
              through the {messages.AppTitle} service. You also agree not to:
              circumvent, remove, alter, deactivate, degrade or thwart any of
              the content protections in the {messages.AppTitle} service; use
              any robot, spider, scraper or other automated means to access the{' '}
              {messages.AppTitle} service; decompile, reverse engineer or
              disassemble any software or other products or processes accessible
              through the {messages.AppTitle} service; insert any code or
              product or manipulate the content of the
              {messages.AppTitle} service in any way; or use any data mining,
              data gathering or extraction method. In addition, you agree not to
              upload, post, e-mail or otherwise send or transmit any material
              designed to interrupt, destroy or limit the functionality of any
              computer software or hardware or telecommunications equipment
              associated with the {messages.AppTitle} service, including any
              software viruses or any other computer code, files or programs. We
              may terminate or restrict your use of our service if you violate
              these Terms of Use or are engaged in illegal or fraudulent use of
              the service.
              <br />
              <br />
              3.6. The quality of the display of the {messages.AppTitle} content
              may vary from device to device, and may be affected by a variety
              of factors, such as your location, the bandwidth available through
              and/or speed of your Internet connection. HD availability is
              subject to your Internet service and device capabilities. Not all
              content is available in all formats, such as HD. Default playback
              settings on cellular networks exclude HD. The minimum connection
              speed for SD quality is 1.0 Mbps; however, we recommend a faster
              connection for improved video quality. A download speed of at
              least 3.0 Mbps per stream is recommended to receive HD content
              (defined as a resolution of 720p or higher). You are responsible
              for all Internet access charges. Please check with your Internet
              provider for information on possible Internet data usage charges.
              The time it takes to begin watching {messages.AppTitle} content
              will vary based on a number of factors, including your location,
              available bandwidth at the time, the content you have selected and
              the configuration of your {messages.AppTitle} ready device.
              <br />
              <br />
              3.7 The Plex&trade; software is developed by, or for,{' '}
              {messages.AppTitle}
              and may solely be used for authorized streaming and viewing of
              content from {messages.AppTitle} through Plex&trade; ready
              devices. This software may vary by device and medium, and
              functionalities and features may also differ between devices. You
              acknowledge that the use of the service may require third party
              software that is subject to third party licenses. You agree that
              you may automatically receive updated versions of the Plex&trade;
              software and related third-party software.
              <br />
            </p>
          </li>
          <li>
            <p>
              <strong>Passwords and Account Access.</strong> The member who
              created the {messages.AppTitle} account (the &quot;Account
              Owner&quot;) is responsible for any activity that occurs through
              the {messages.AppTitle}
              account. To maintain control over the account and to prevent
              anyone from accessing the account (which would include information
              on viewing history for the account), the Account Owner should
              maintain control over the Plex&trade; ready devices that are used
              to access the service and not reveal the password associated with
              the account to anyone. You are responsible for updating and
              maintaining the accuracy of the information you provide to us
              relating to your account. We can terminate your account or place
              your account on hold in order to protect you, {
                messages.AppTitle
              }{' '}
              or our partners from identity theft or other fraudulent activity.
              <br />
            </p>
          </li>
          <li>
            <p>
              <strong>Warranties and Limitations on Liability.</strong> The
              {messages.AppTitle} service is provided &quot;as is&quot; and
              without warranty or condition. In particular, our service may not
              be uninterrupted or error-free. You waive all special, indirect
              and consequential damages against us. These terms will not limit
              any non-waivable warranties or consumer protection rights that you
              may be entitled to under the mandatory laws of your country of
              residence.
              <br />
            </p>
          </li>
          <li>
            <p>
              <strong>Class Action Waiver.</strong> WHERE PERMITTED UNDER THE
              APPLICABLE LAW, YOU AND {messages.AppTitle} AGREE THAT EACH MAY
              BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL
              CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED
              CLASS OR REPRESENTATIVE PROCEEDING. Further, where permitted under
              the applicable law, unless both you and {messages.AppTitle} agree
              otherwise, the court may not consolidate more than one
              person&apos;s claims with your claims, and may not otherwise
              preside over any form of a representative or class proceeding.
              <br />
            </p>
          </li>
        </ul>
      </div>
      <p>
        <strong>Last Updated:</strong> Jan 4, 2024
      </p>
    </div>
  );
};

export default TermsStatement;
