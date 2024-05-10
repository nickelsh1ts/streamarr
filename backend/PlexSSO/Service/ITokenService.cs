using System.Threading.Tasks;
using PlexSSO.Model.Internal;
using PlexSSO.Model.Types;

namespace PlexSSO.Service
{
    public interface ITokenService
    {
        bool Matches((Protocol, string, string) redirectComponents);
        Task<AuthenticationToken> GetServiceToken(Identity identity);
    }
}
