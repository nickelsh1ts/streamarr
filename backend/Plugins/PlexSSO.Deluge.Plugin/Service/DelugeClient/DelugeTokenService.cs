using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using PlexSSO.Deluge.Plugin.Model;
using PlexSSO.Extensions;
using PlexSSO.Model;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;
using PlexSSO.Service;
using PlexSSO.Service.Config;

namespace PlexSSO.Deluge.Plugin.Service.DelugeClient
{
    public class DelugeTokenService : ITokenService
    {
        private const string DelugeCookieName = "_session_id";

        private readonly HttpClient _httpClient;
        private readonly IConfigurationService<PlexSsoConfig> _configurationService;

        public DelugeTokenService(IHttpClientFactory clientFactory,
                                  IConfigurationService<PlexSsoConfig> configurationService)
        {
            _httpClient = clientFactory.CreateClient();
            _configurationService = configurationService;
        }

        public bool Matches((Protocol, string, string) redirectComponents)
        {
            var (_, hostname, _) = redirectComponents;
            return GetHostname().Contains(hostname);
        }

        public async Task<AuthenticationToken> GetServiceToken(Identity identity)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, GetHostname() + "/json");
            request.Content = new StringContent("{\"method\":\"auth.login\",\"params\":[\"\"],\"id\":0}", Encoding.UTF8, "application/json");
            request.Headers.Add("Accept", "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var cookie = response.Headers.GetCookies()
                .FirstOrDefault(c => c.Name == DelugeCookieName);

            if (cookie == null)
            {
                return null;
            }

            return new AuthenticationToken(
                DelugeCookieName,
                cookie.Value.Value,
                cookie.Expires ?? DateTimeOffset.Now.AddDays(Constants.RedirectCookieExpireDays)
            );
        }

        private string GetHostname()
        {
            return _configurationService.Config
                .Plugins
                .GetOrDefault(DelugeConstants.PluginName)?
                .GetOrDefault(DelugeConstants.PublicHostname) ?? "";
        }
    }
}
