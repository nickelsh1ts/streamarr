import useSettings from '@app/hooks/useSettings';

const ManageAccount = () => {
  const settings = useSettings();
  const messages = {
    AppTitle: `${settings.currentSettings.applicationTitle}`,
  };

  return (
    <>
      <div className="col text-dark mt-4">
        <h5 className="fw-bold mb-4">Manage Account</h5>
        <a
          href="/watch/web/index.html#!/settings/account"
          className="text-decoration-none link-dark"
        >
          <p>Manage account preferences</p>
        </a>
        <a
          href="/watch/web/index.html#!/settings/web/general"
          className="text-decoration-none link-dark"
        >
          <p>Manage web preferences</p>
        </a>
        <a
          href="/watch/web/index.html#!/settings/online-media-sources"
          className="text-decoration-none link-dark"
        >
          <p>
            Turn on/off non-
            <span className="text-purple">{messages.AppTitle}</span> content
          </p>
        </a>
      </div>
    </>
  );
};

export default ManageAccount;
