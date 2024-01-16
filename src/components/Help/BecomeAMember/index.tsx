import PageTitle from '@app/components/Common/PageTitle';
import HelpPages from '@app/components/Help/HelpPages';
import useSettings from '@app/hooks/useSettings';

const BecomeAMember = () => {
  const settings = useSettings();
  const messages = {
    becomeamember: 'Become A Member',
  };

  return (
    <>
      <PageTitle title={messages.becomeamember} />
      <HelpPages>
        <main className="mx-md-5">
          <div className="row align-items-center rounded-3 bg-dark text-light m-2 mb-5 border p-2 shadow-lg">
            <div className="col-lg-7 p-lg-5 pt-lg-3 p-3">
              <h1 className="display-4 fw-bold lh-1">
                How to become a member of{' '}
                <span className="text-purple">
                  {settings.currentSettings.applicationTitle}
                </span>
              </h1>
              <p className="lead">
                <span className="text-purple">
                  {settings.currentSettings.applicationTitle}
                </span>{' '}
                is a private members access streaming service.
              </p>
              <p className="lead">
                Currently members can only be invited by an already active
                member of{' '}
                <span className="text-purple">
                  {settings.currentSettings.applicationTitle}
                </span>
                . Please reach out to a friend and ask them to send you an
                invite.
              </p>
              <p className="lead">
                Unfortunetly at this time, new members are not being accepted
                otherwise.
              </p>
              <p className="lead">
                To invite a friend simply log into your account, select options
                from the menu and click invite a friend. Share the generated
                code with your friend and send them to{' '}
                <a
                  className="link-purple text-decoration-none"
                  href="//{settings.currentSettings.applicationTitle}tv.com/join"
                >
                  {settings.currentSettings.applicationTitle}.com/join
                </a>
              </p>
            </div>
            <div className="col-lg-4 offset-lg-1 overflow-hidden p-0 shadow-lg">
              <img
                className="rounded-lg-3"
                src="/img/app-home.png"
                alt=""
                width="920"
              />
            </div>
          </div>
        </main>
      </HelpPages>
    </>
  );
};

export default BecomeAMember;
