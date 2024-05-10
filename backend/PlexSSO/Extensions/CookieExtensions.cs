using System;
using System.Linq;
using System.Net.Http.Headers;
using System.Reflection;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;
using SameSiteMode = Microsoft.Net.Http.Headers.SameSiteMode;

namespace PlexSSO.Extensions
{
    public static class CookieExtensions
    {
        private static PropertyInfo _headerPropertyInfo;

        public static void AppendWithoutEncoding(this IResponseCookies responseCookies, string key, string value, CookieOptions options)
        {
            if (options == null)
            {
                throw new ArgumentNullException(nameof(options));
            }

            var setCookieHeaderValue = new SetCookieHeaderValue(key, value)
            {
                Domain = options.Domain,
                Path = options.Path,
                Expires = options.Expires,
                MaxAge = options.MaxAge,
                Secure = options.Secure,
                SameSite = (SameSiteMode) options.SameSite,
                HttpOnly = options.HttpOnly
            };

            var cookieValue = setCookieHeaderValue.ToString();

            var headers = GetHeaders(responseCookies);

            headers[HeaderNames.SetCookie] = StringValues.Concat(headers[HeaderNames.SetCookie], cookieValue);
        }

        private static IHeaderDictionary GetHeaders(IResponseCookies responseCookies)
        {
            if (_headerPropertyInfo == null)
            {
                _headerPropertyInfo = responseCookies.GetType().GetProperty("Headers", BindingFlags.NonPublic | BindingFlags.Instance);
            }

            return (IHeaderDictionary) _headerPropertyInfo.GetValue(responseCookies);
        }

        public static SetCookieHeaderValue[] GetCookies(this HttpResponseHeaders headers)
        {
            return headers
                .Where(header => header.Key == "Set-Cookie")
                .SelectMany(header => header.Value)
                .Select(value => SetCookieHeaderValue.Parse(value))
                .ToArray();
        }
    }
}
