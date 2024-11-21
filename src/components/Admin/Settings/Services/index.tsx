const ServicesSettings = () => {
  return (
    <>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Radarr Settings</h3>
        <p className="mb-5">Configure your Radarr server below.</p>
      </form>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Sonarr Settings</h3>
        <p className="mb-5">Configure your Sonarr server below.</p>
      </form>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Prowlarr Settings</h3>
        <p className="mb-5">Configure your Prowlarr server below.</p>
      </form>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Bazarr Settings</h3>
        <p className="mb-5">Configure your Bazarr server below.</p>
      </form>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Tdarr Settings</h3>
        <p className="mb-5">Configure your Tdarr server below.</p>
      </form>
      <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <h3 className="text-2xl font-extrabold">Downloads Settings</h3>
        <p className="mb-5">Configure your Download server below.</p>
      </form>
    </>
  );
};
export default ServicesSettings;
