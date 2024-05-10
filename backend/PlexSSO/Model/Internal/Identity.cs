using System;
using System.Collections.Generic;
using System.Security.Claims;
using PlexSSO.Model.Types;

namespace PlexSSO.Model.Internal
{
    public class Identity
    {
        public AccessTier AccessTier { get; set; } = AccessTier.NoAccess;
        public AccessToken AccessToken { get; set; }
        public ServerIdentifier ServerIdentifier { get; set; }
        public Username Username { get; set; }
        public Email Email { get; set; }
        public Thumbnail Thumbnail { get; set; } = new Thumbnail("https://about:blank");
        public bool IsAuthenticated { get; set; }

        public Identity(in IEnumerable<Claim> claims)
        {
            foreach (var claim in claims)
            {
                switch (claim.Type)
                {
                    case Constants.AccessTierClaim:
                        AccessTier = (AccessTier)Enum.Parse(typeof(AccessTier), claim.Value);
                        break;
                    case Constants.AccessTokenClaim:
                        AccessToken = new AccessToken(claim.Value);
                        IsAuthenticated = true;
                        break;
                    case Constants.ServerIdentifierClaim:
                        ServerIdentifier = new ServerIdentifier(claim.Value);
                        break;
                    case Constants.UsernameClaim:
                        Username = new Username(claim.Value);
                        break;
                    case Constants.EmailClaim:
                        Email = new Email(claim.Value);
                        break;
                    case Constants.ThumbnailClaim:
                        Thumbnail = new Thumbnail(claim.Value);
                        break;
                }
            }
        }

        public IEnumerable<Claim> AsClaims()
        {
            return new List<Claim>
            {
                new Claim(Constants.AccessTierClaim, AccessTier.ToString()),
                new Claim(Constants.AccessTokenClaim, AccessToken.Value),
                new Claim(Constants.ServerIdentifierClaim, ServerIdentifier.Value),
                new Claim(Constants.UsernameClaim, Username.Value),
                new Claim(Constants.EmailClaim, Email.Value),
                new Claim(Constants.ThumbnailClaim, Thumbnail.Value)
            };
        }
    }
}
