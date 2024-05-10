using Microsoft.Extensions.DependencyInjection;
using PlexSSO.Plugin;
using PlexSSO.Service;
using PlexSSO.Tautulli.Plugin.Model;
using PlexSSO.Tautulli.Plugin.TautulliClient;

namespace PlexSSO.Tautulli.Plugin
{
    public class PluginDescriptor : IPlugin
    {
        public string Name { get; } = TautulliConstants.PluginName;

        public void RegisterServices(IServiceCollection services)
        {
            services.AddSingleton<ITokenService, TautulliTokenService>();
        }
    }
}
