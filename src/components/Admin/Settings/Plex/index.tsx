const PlexSettings = () => {
  return (
    <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
      <h3 className="text-2xl font-extrabold">Plex Settings</h3>
      <p className="mb-5">
        Configure the settings for your Plex server. Streamarr scans your Plex
        libraries to generate menus.
      </p>
    </form>
  );
};
export default PlexSettings;
