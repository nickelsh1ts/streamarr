const ServicesSettings = () => {
  return (
    <div>
      <h3 className="text-2xl font-extrabold">Radarr Settings</h3>
      <p className="mb-5">
        Configure your Radarr server(s) below. You can connect multiple Radarr
        servers, but only two of them can be marked as defaults (one non-4K and
        one 4K).
      </p>
      <h3 className="text-2xl font-extrabold">Sonarr Settings</h3>
      <p className="mb-5">
        Configure your Sonarr server(s) below. You can connect multiple Sonarr
        servers, but only two of them can be marked as defaults (one non-4K and
        one 4K).
      </p>
    </div>
  );
};
export default ServicesSettings;
