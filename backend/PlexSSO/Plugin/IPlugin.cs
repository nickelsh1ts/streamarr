using Microsoft.Extensions.DependencyInjection;

namespace PlexSSO.Plugin
{
    public interface IPlugin
    {
        string Name { get; }
        void RegisterServices(IServiceCollection services);
    }
}
