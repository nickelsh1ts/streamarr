using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using PlexSSO.Model.Internal;
using IPlugin = PlexSSO.Plugin.IPlugin;

namespace PlexSSO.Service.Plugin
{
    public static class PluginLoader
    {
        public static void LoadPlugins(Config.IConfigurationService<PlexSsoConfig> plexSsoConfig,
                                       IServiceCollection serviceCollection)
        {
            var pluginDirectory = plexSsoConfig.Config.PluginDirectory;
            foreach (var plugin in Directory.EnumerateFiles(pluginDirectory, "*.Plugin.dll", SearchOption.TopDirectoryOnly))
            {
                var pluginPath = Path.Combine(pluginDirectory, plugin);
                Console.WriteLine($"Loading {pluginPath}");
                LoadPlugins(pluginPath, serviceCollection);
            }
        }

        private static void LoadPlugins(string plugin, IServiceCollection serviceCollection)
        {
            var assembly = Assembly.LoadFile(plugin);
            var types = assembly.GetTypes()
                .Where(aType => aType.IsAssignableTo(typeof(IPlugin)));

            foreach (var type in types)
            {
                var instance = Activator.CreateInstance(type) as IPlugin;
                instance.RegisterServices(serviceCollection);
                Console.WriteLine($"Loaded plugin {instance.Name}");
            }
        }
    }
}
