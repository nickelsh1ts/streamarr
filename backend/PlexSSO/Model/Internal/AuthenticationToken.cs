using System;

namespace PlexSSO.Model.Internal
{
    public class AuthenticationToken
    {
        public string CookieName { get; }
        public string CookieValue { get; }
        public DateTimeOffset Expires { get; }
        public string Location { get; }
        public int StatusCode { get; }

        public AuthenticationToken(in string cookieName,
                                   in string cookieValue,
                                   in DateTimeOffset expires, 
                                   in string location = "",
                                   in int statusCode = 302)
        {
            CookieName = cookieName;
            CookieValue = cookieValue;
            Expires = expires;
            Location = location;
            StatusCode = statusCode;
        }
    }
}
