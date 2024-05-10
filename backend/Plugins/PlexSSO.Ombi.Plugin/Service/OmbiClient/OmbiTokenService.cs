using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using PlexSSO.Extensions;
using PlexSSO.Model;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;
using PlexSSO.Ombi.Plugin.Extensions;
using PlexSSO.Ombi.Plugin.Model;
using PlexSSO.Service;
using PlexSSO.Service.Config;

namespace PlexSSO.Ombi.Plugin.Service.OmbiClient
{
    public class OmbiTokenService : ITokenService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfigurationService<PlexSsoConfig> _configurationService;

        public OmbiTokenService(IHttpClientFactory clientFactory,
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
            
            var request = new HttpRequestMessage(HttpMethod.Post, GetHostname() + "/api/v1/token/plextoken");
            request.Content = new StringContent($"{{\"plexToken\":\"{identity.AccessToken.Value}\"}}", Encoding.UTF8, "application/json");
            request.Headers.Add("Accept", "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();

            var ombiResponse = JsonSerializer.Deserialize<OmbiTokenResponse>(json, new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                PropertyNamingPolicy = new SnakeCaseNamingPolicy(),
                PropertyNameCaseInsensitive = true
            });

            if (string.IsNullOrWhiteSpace(ombiResponse?.AccessToken))
            {
                return null;
            }

            return new AuthenticationToken(
                "Auth",
                ombiResponse.AccessToken,
                DateTimeOffset.Now.AddDays(Constants.RedirectCookieExpireDays),
                "/auth/cookie");
        }

        private string GetHostname()
        {
            return _configurationService.Config
                .Plugins
                .GetOrDefault(OmbiConstants.PluginName)?
                .GetOrDefault(OmbiConstants.PublicHostname) ?? "";
        }
    }
}

