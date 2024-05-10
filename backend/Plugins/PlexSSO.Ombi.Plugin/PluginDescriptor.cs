using Microsoft.Extensions.DependencyInjection;
using PlexSSO.Ombi.Plugin.Model;
using PlexSSO.Ombi.Plugin.Service.OmbiClient;
using PlexSSO.Plugin;
using PlexSSO.Service;

namespace PlexSSO.Ombi.Plugin
{
    public class PluginDescriptor : IPlugin
    {
        public string Name { get; } = OmbiConstants.PluginName;

        public void RegisterServices(IServiceCollection services)
        {
            services.AddSingleton<ITokenService, OmbiTokenService>();
        }
    }
}
