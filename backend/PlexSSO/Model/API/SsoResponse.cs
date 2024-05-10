using PlexSSO.Model.Types;

namespace PlexSSO.Model.API
{
    public class SsoResponse : BasicResponse
    {
        public AccessTier Tier { get; }
        public bool LoggedIn { get; }
        public bool AccessBlocked { get; }
        public int Status { get; }
        public string Message { get; }

        public SsoResponse(bool success, bool loggedIn, bool blocked, AccessTier accessTier, int status, string message) : base(success)
        {
            LoggedIn = loggedIn;
            AccessBlocked = blocked;
            Tier = accessTier;
            Status = status;
            Message = message;
        }
    }
}
