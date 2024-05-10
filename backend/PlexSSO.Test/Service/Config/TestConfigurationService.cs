using PlexSSO.Model.Internal;
using PlexSSO.Service.Config;

namespace PlexSSO.Test.Service.Config;

public class TestConfigurationService : IConfigurationService<PlexSsoConfig>
{
    public PlexSsoConfig Config { get; }
    public string GetConfigurationDirectory()
    {
        return "/";
    }

    public TestConfigurationService(PlexSsoConfig config)
    {
        Config = config;
    }
}