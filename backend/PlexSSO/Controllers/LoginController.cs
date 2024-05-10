using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PlexSSO.Model;
using PlexSSO.Model.API;
using PlexSSO.Model.Types;
using PlexSSO.Service.Auth;
using PlexSSO.Service.PlexClient;

namespace PlexSSO.Controllers
{
    [ApiController]
    [Route(Constants.ControllerPath)]
    public class LoginController : CommonAuthController
    {
        private readonly ILogger<LoginController> _logger;
        private readonly IPlexClient _plexClient;
        private readonly IAuthValidator _authValidator;
        private readonly ServerIdentifier _serverIdentifier;

        public LoginController(ILogger<LoginController> logger,
                               IPlexClient plexClient,
                               IAuthValidator authValidator)
        {
            _logger = logger;
            _plexClient = plexClient;
            _authValidator = authValidator;
            _serverIdentifier = plexClient.GetPlexServerIdentifier();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<SsoResponse> Login([FromBody] LoginPost data)
        {
            try
            {
                Identity.AccessToken = new AccessToken(data.Token);
                Identity.ServerIdentifier = _serverIdentifier;

                if (!Identity.IsAuthenticated)
                {
                    Identity.AccessTier = await _plexClient.GetAccessTier(_serverIdentifier, Identity.AccessToken);
                }

                if (Identity.AccessTier == AccessTier.Failure)
                {
                    Identity.AccessTier = AccessTier.NoAccess;
                    Identity.IsAuthenticated = false;
                    return GetErrorResponse();
                }

                var user = await _plexClient.GetUserInfo(Identity.AccessToken);
                Identity.Email = user.Email;
                Identity.Username = user.Username;
                Identity.Thumbnail = user.Thumbnail;

                Identity.IsAuthenticated = true;

                var identity = new ClaimsIdentity(
                    Identity.AsClaims(),
                    CookieAuthenticationDefaults.AuthenticationScheme
                );

                var authProperties = new AuthenticationProperties
                {
                    AllowRefresh = true,
                    IsPersistent = true
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(identity),
                    authProperties
                );

                var response = _authValidator.ValidateAuthenticationStatus(Identity, ServiceName, ServiceUri);
                Response.StatusCode = response.Status;
                return response;
            }
            catch (Exception e)
            {
                _logger.LogError("Failed to log user in", e);
                Identity.AccessTier = AccessTier.NoAccess;
                Identity.IsAuthenticated = false;
                return GetErrorResponse();
            }
        }

        private SsoResponse GetErrorResponse()
        {
            Response.StatusCode = 400;
            return new SsoResponse(false,
                Identity.IsAuthenticated,
                true,
                AccessTier.NoAccess,
                400,
                "An error occurred");
        }
    }
}
