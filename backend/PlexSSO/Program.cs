using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using PlexSSO.Extensions;
using PlexSSO.Model;
using PlexSSO.Model.Internal;
using PlexSSO.Service.HealthCheck;

namespace PlexSSO
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            if (args.Contains("--healthcheck"))
            {
                await HealthChecker.CheckHealth($"http://127.0.0.1:{Constants.PortNumber}{Constants.HealthcheckPath}");
                return;
            }

            WebHost.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.AddCommandLine(args, typeof(PlexSsoConfig).GetAnnotatedCliArgumentsAsDictionary());
                })
                .ConfigureKestrel((context, options) => options.AddServerHeader = false)
                .UseStartup<Startup>()
                .UseUrls($"http://0.0.0.0:{Constants.PortNumber}/")
                .Build()
                .Run();
        }
    }
}
