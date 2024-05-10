using Microsoft.Extensions.DependencyInjection;
using PlexSSO.Deluge.Plugin.Model;
using PlexSSO.Deluge.Plugin.Service.DelugeClient;
using PlexSSO.Plugin;
using PlexSSO.Service;

namespace PlexSSO.Deluge.Plugin
{
    public class PluginDescriptor : IPlugin
    {
        public string Name { get; } = DelugeConstants.PluginName;

        public void RegisterServices(IServiceCollection services)
        {
            services.AddSingleton<ITokenService, DelugeTokenService>();
        }
    }
}
