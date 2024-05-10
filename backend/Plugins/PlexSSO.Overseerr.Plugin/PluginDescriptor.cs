using Microsoft.Extensions.DependencyInjection;
using PlexSSO.Overseerr.Plugin.Model;
using PlexSSO.Overseerr.Plugin.OverseerrClient;
using PlexSSO.Plugin;
using PlexSSO.Service;

namespace PlexSSO.Overseerr.Plugin
{
    public class PluginDescriptor : IPlugin
    {
        public string Name { get; } = OverseerrConstants.PluginName;

        public void RegisterServices(IServiceCollection services)
        {
            services.AddSingleton<ITokenService, OverseerrTokenService>();
        }
    }
}
