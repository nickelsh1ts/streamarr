namespace PlexSSO.Model
{
    public static class Constants
    {
        public const string ConfigurationDirectoryKey = "config";
        public const string ConfigurationFileName = "config.json";

        public const string ApplicationName = "PlexSSO";
        public const int PortNumber = 3000;
        public const string ApiPrefix = "api/v2/";
        public const string ControllerPath = ApiPrefix + "[controller]";
        public const string HealthcheckPath = "/" + ApiPrefix + "healthcheck";
        public const string FourOhThreePath = "/sso/403";

        public const string CookieName = "kPlexSSOKookieV2";
        public const int CookieExpireDays = 1;
        public const int RedirectCookieExpireDays = 1;
        public const int KeyLifeSpanDays = 500;

        public const string CsrfCookieName = "kPlexSSOCsrfKookie";
        public const string CsrfHeaderName = "X-PlexSSO-CSRF-Token";

        public const string PoweredByHeaderName = "X-Powered-By";
        public const string PoweredByHeaderValue = "One small piece of fairy cake";

        public const string AccessTierClaim = "AccessTier";
        public const string AccessTokenClaim = "AccessToken";
        public const string ServerIdentifierClaim = "ServerIdentifier";
        public const string UsernameClaim = "Username";
        public const string EmailClaim = "Email";
        public const string ThumbnailClaim = "Thumbnail";
        public const string SsoServiceHeader = "X-PlexSSO-For";
        public const string SsoOrigionalUriHeader = "X-PlexSSO-Original-URI";
        public const string UpstreamProtocolHeader = "X-Upstream-Protocol";
        public const string ForwardedProtoHeader = "X-Forwarded-Proto";
        public const string FrontEndHttpsHeader = "Front-End-Https";
        public const string ForwardedProtocolHeader = "X-Forwarded-Protocol";
        public const string ForwardedSslHeader = "X-Forwarded-Ssl";
        public const string UrlSchemeHeader = "X-Url-Scheme";

        public const string SsoResponseUserHeader = "X-PlexSSO-Username";
        public const string SsoResponseEmailHeader = "X-PlexSSO-Email";

        public const string DefaultAccessDeniedMessage = "Access Denied";
        public const string DefaultLoginRequiredMessage = "Login Required";
    }
}
