using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PlexSSO.Model.Internal;
using PlexSSO.Service.Auth;
using PlexSSO.Service.Config;
using PlexSSO.Service.PlexClient;

namespace PlexSSO.Service
{
    public static class ServiceRegistry
    {
        public static Config.IConfigurationService<PlexSsoConfig> LoadConfiguration(IConfiguration configuration)
        {
            return new ConfigurationService<PlexSsoConfig>(configuration);
        }

        public static void RegisterServices(IServiceCollection services)
        {
            services.AddSingleton<IPlexClient, PlexHttpClient>();
            services.AddSingleton<IAuthValidator, AuthenticationValidator>();
        }
    }
}
