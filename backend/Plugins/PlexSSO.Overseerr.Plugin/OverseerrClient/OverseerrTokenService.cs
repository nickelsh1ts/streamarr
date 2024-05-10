using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using PlexSSO.Extensions;
using PlexSSO.Model;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;
using PlexSSO.Overseerr.Plugin.Model;
using PlexSSO.Service;
using PlexSSO.Service.Config;

namespace PlexSSO.Overseerr.Plugin.OverseerrClient
{
    public class OverseerrTokenService : ITokenService
    {
        private const string OverseerrCookieName = "connect.sid";

        private readonly HttpClient _httpClient;
        private readonly IConfigurationService<PlexSsoConfig> _configurationService;
        private readonly ILogger<OverseerrTokenService> _logger;

        public OverseerrTokenService(IHttpClientFactory clientFactory,
                                     IConfigurationService<PlexSsoConfig> configurationService,
                                     ILogger<OverseerrTokenService> logger)
        {
            _httpClient = clientFactory.CreateClient();
            _configurationService = configurationService;
            _logger = logger;
        }

        public bool Matches((Protocol, string, string) redirectComponents)
        {
            var (_, hostname, _) = redirectComponents;
            return GetHostname().Contains(hostname);
        }

        public async Task<AuthenticationToken> GetServiceToken(Identity identity)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, GetHostname() + "/api/v1/auth/plex");
            request.Content = new StringContent($"{{\"authToken\":\"{identity.AccessToken.Value}\"}}", Encoding.UTF8, "application/json");
            request.Headers.Add("Accept", "application/json");
            request.Headers.Add("User-Agent", "PlexSSO/2");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var cookie = response.Headers.GetCookies()
                .FirstOrDefault(c => c.Name == OverseerrCookieName);

            if (cookie == null)
            {
                var respStr = await response.Content.ReadAsStringAsync();
                _logger.LogError("Authentication cookie was not returned from Overseerr");
                _logger.LogWarning(respStr);
                return null;
            }

            return new AuthenticationToken(
                OverseerrCookieName,
                Uri.UnescapeDataString(cookie.Value.Value),
                cookie.Expires ?? DateTimeOffset.Now.AddDays(Constants.RedirectCookieExpireDays),
                "/"
            );
        }

        private string GetHostname()
        {
            return _configurationService.Config
                .Plugins
                .GetOrDefault(OverseerrConstants.PluginName)?
                .GetOrDefault(OverseerrConstants.PublicHostname) ?? "";
        }
    }
}
