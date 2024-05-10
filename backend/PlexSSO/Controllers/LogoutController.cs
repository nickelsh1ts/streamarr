using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PlexSSO.Model;
using PlexSSO.Model.API;

namespace PlexSSO.Controllers
{
    [ApiController]
    [Route(Constants.ControllerPath)]
    public class LogoutController : ControllerBase
    {
        private readonly ILogger<LogoutController> _logger;

        public LogoutController(ILogger<LogoutController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public async Task<BasicResponse> Logout()
        {
            try
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return new BasicResponse(true);
            }
            catch (Exception e)
            {
                _logger.LogError("Failed to log a user out", e);
                Response.StatusCode = 400;
                return new BasicResponse(false);
            }
        }
    }
}

