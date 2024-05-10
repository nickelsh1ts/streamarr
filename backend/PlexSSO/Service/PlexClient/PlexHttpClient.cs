using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Xml.Linq;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;

namespace PlexSSO.Service.PlexClient
{
    public class PlexHttpClient : IPlexClient
    {
        private readonly HttpClient _httpClient;
        private readonly Config.IConfigurationService<PlexSsoConfig> _configurationService;

        public PlexHttpClient(IHttpClientFactory clientFactory, Config.IConfigurationService<PlexSsoConfig> configurationService)
        {
            _configurationService = configurationService;
            _httpClient = clientFactory.CreateClient();
        }

        public ServerIdentifier GetPlexServerIdentifier()
        {
            var config = _configurationService.Config;
            if (config.ServerIdentifier == null)
            {
                var xml = File.ReadAllText(config.PlexPreferencesFile ?? "Preferences.xml");
                var xmlDoc = XDocument.Parse(xml).Root;
                var id = xmlDoc?.Attribute("ProcessedMachineIdentifier")?.Value;
                config.ServerIdentifier = id == null ? null : new ServerIdentifier(id);
            }
            return config.ServerIdentifier;
        }

        public async Task<AccessTier> GetAccessTier(ServerIdentifier serverId, AccessToken token)
        {
            try
            {
                var servers = await GetServers(token);
                var serverDetails = GetServerDetails(servers);
                var accessLevel = serverDetails.Where(x => x.Item1 == serverId)
                    .Select(x => x.Item2)
                    .FirstOrDefault();
                return accessLevel == default ? AccessTier.NoAccess : accessLevel;
            }
            catch
            {
                return AccessTier.Failure;
            }
        }

        public async Task<User> GetUserInfo(AccessToken token)
        {
            var xml = await PerformGetRequest(token, "/users/account");
            var xmlDoc = XDocument.Parse(xml).Root;

            return new User(
                xmlDoc?.Element("username")?.Value ?? string.Empty,
                xmlDoc?.Element("email")?.Value ?? string.Empty,
                xmlDoc?.Attribute("thumb")?.Value ?? string.Empty
            );
        }

        private async Task<IEnumerable<(string, string, string)>> GetServers(AccessToken token)
        {
            var xml = await PerformGetRequest(token, "/api/resources");
            var xmlDoc = XDocument.Parse(xml).Root;
            return xmlDoc
                ?.Elements("Device")
                .Select(x => (
                    x.Attribute("clientIdentifier")?.Value,
                    x.Attribute("owned")?.Value ?? "0",
                    x.Attribute("home")?.Value ?? "0"
                ));
        }

        private async Task<string> PerformGetRequest(AccessToken token, string path)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://plex.tv" + path);
            request.Headers.Add("includeHttps", "1");
            request.Headers.Add("includeRelay", "1");
            request.Headers.Add("X-Plex-Product", "PlexSSO");
            request.Headers.Add("X-Plex-Version", "Plex OAuth");
            request.Headers.Add("X-Plex-Client-Identifier", "PlexSSOv2");
            request.Headers.Add("X-Plex-Token", token.Value);
            request.Headers.Add("Accept", "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        private IEnumerable<(ServerIdentifier, AccessTier)> GetServerDetails(IEnumerable<(string, string, string)> servers)
        {
            return servers.Select(x =>
            {
                var accessLevel = AccessTier.NormalUser;
                if (x.Item2 == "1")
                {
                    accessLevel = AccessTier.Owner;
                }
                else if (x.Item3 == "1")
                {
                    accessLevel = AccessTier.HomeUser;
                }
                return (
                    new ServerIdentifier(x.Item1),
                    accessLevel
                );
            });
        }
    }
}

