using PlexSSO.Model.API;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;

namespace PlexSSO.Service.Auth
{
    public interface IAuthValidator
    {
        SsoResponse ValidateAuthenticationStatus(
            Identity identity,
            ServiceName serviceName,
            ServiceUri serviceUri
        );
    }
}
