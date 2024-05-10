using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PlexSSO.Extensions;
using PlexSSO.Model.API;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;
using PlexSSO.Service;
using PlexSSO.Service.Config;

namespace PlexSSO.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RedirectController : CommonAuthController
    {
        private readonly IConfigurationService<PlexSsoConfig> _configurationService;
        private readonly IEnumerable<ITokenService> _tokenServices;
        private readonly ILogger<RedirectController> _logger;

        public RedirectController(IConfigurationService<PlexSsoConfig> configurationService,
                                  IEnumerable<ITokenService> tokenServices,
                                  ILogger<RedirectController> logger)
        {
            _configurationService = configurationService;
            _tokenServices = tokenServices;
            _logger = logger;
        }

        [HttpGet("{*location}")]
        public async Task<BasicResponse> Get(string location)
        {           
            var redirectComponents = GetRedirectComponents(location);
            int redirectStatus;

            var service = _tokenServices.FirstOrDefault(tokenService => tokenService.Matches(redirectComponents));

            AuthenticationToken authToken;
            if (service != null && (authToken = await service.GetServiceToken(Identity)) != null)
            {
                redirectStatus = GenerateRedirect(authToken, redirectComponents);
            }
            else
            {
                redirectStatus = GenerateNormalRedirectUrl(redirectComponents);
            }

            Response.StatusCode = redirectStatus;
            return new BasicResponse(true);
        }

        private int GenerateRedirect(AuthenticationToken authenticationToken,
                                     (Protocol, string, string) redirectComponents)
        {
            var (protocol, host, path) = redirectComponents;
            var protoString = protocol == Protocol.Https ? "https://" : "http://";
            var location = string.IsNullOrWhiteSpace(authenticationToken.Location)
                ? path
                : authenticationToken.Location;
            Response.Headers.Add("Location", protoString + host + location);
            Response.Cookies.AppendWithoutEncoding(authenticationToken.CookieName, authenticationToken.CookieValue, new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.Lax,
                Expires = authenticationToken.Expires,
                Domain = _configurationService.Config.CookieDomain,
                Path = "/",
                Secure = false
            });
            _logger.LogInformation($"Performing service specific redirect to '{location}' with status {authenticationToken.StatusCode}");
            return authenticationToken.StatusCode;
        }

        private int GenerateNormalRedirectUrl((Protocol, string, string) redirectComponents)
        {
            var (protocol, host, path) = redirectComponents;
            var protoString = protocol == Protocol.Https ? "https://" : "http://";
            var location = protoString + host + path;
            Response.Headers.Add("Location", location);
            _logger.LogInformation($"Performing normal redirect to '{location}' with status 302");
            return 302;
        }

        private (Protocol, string, string) GetRedirectComponents(string location)
        {
            var spl = location.Split('/');
            var host = GetHostWithPort(spl[0]);
            var path = "/" + string.Join('/', spl[1..]) + Request.QueryString.Value;
            return (Protocol, host, path);
        }

        private string GetHostWithPort(string subdomain)
        {
            var port = Request.Host.Port.HasValue ? $":{Request.Host.Port.Value}" : "";
            var spl = Request.Host.Host.Split('.');
            string host;
            if (spl.Length < 3)
            {
                host = "." + Request.Host.Host;
            }
            else
            {
                host = Request.Host.Host.Substring(Request.Host.Host.IndexOf('.'));
            }
            return subdomain + host + port;
        }
    }
}
