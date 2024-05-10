using System.Linq;
using Microsoft.AspNetCore.Mvc;
using PlexSSO.Model;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;

namespace PlexSSO.Controllers
{
    public abstract class CommonAuthController : ControllerBase
    {
        private Identity _identity;

        protected Identity Identity => _identity ??= new Identity(User.Claims);

        protected Protocol Protocol
        {
            get
            {
                var headerValue = GetFirstHeader(
                    Constants.UpstreamProtocolHeader,
                    Constants.ForwardedProtoHeader,
                    Constants.FrontEndHttpsHeader,
                    Constants.ForwardedProtocolHeader,
                    Constants.ForwardedSslHeader,
                    Constants.UrlSchemeHeader
                );
                switch (headerValue)
                {
                    case "on":
                    case "https":
                        return Protocol.Https;
                    case "off":
                    case "http":
                        return Protocol.Http;
                    default:
                        if (Request.IsHttps)
                        {
                            goto case "on";
                        }
                        else
                        {
                            goto case "off";
                        }
                }
            }
        }

        protected ServiceName ServiceName
        {
            get
            {
                var serviceName = GetHeader(Constants.SsoServiceHeader, null);
                return string.IsNullOrWhiteSpace(serviceName) ? null : new ServiceName(serviceName);
            }
        }

        protected ServiceUri ServiceUri
        {
            get
            {
                var serviceUri = GetHeader(Constants.SsoOrigionalUriHeader, null);
                return string.IsNullOrWhiteSpace(serviceUri) ? null : new ServiceUri(serviceUri);
            }
        }

        private string GetFirstHeader(params string[] keys)
        {
            return (from key in keys
                    where HttpContext.Request.Headers.ContainsKey(key)
                    select HttpContext.Request.Headers[key][0])
                .FirstOrDefault();
        }

        private string GetHeader(string key, string defaultValue)
        {
            if (!HttpContext.Request.Headers.TryGetValue(key, out var headerValue))
            {
                headerValue = defaultValue;
            }
            return headerValue;
        }
    }
}
