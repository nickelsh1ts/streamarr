using PlexSSO.Model.Types;

namespace PlexSSO.Extensions
{
    public static class AccessTierExtensions
    {
        public static bool IsLowerTierThan(this AccessTier currentAccess, AccessTier accessTier)
        {
            return currentAccess > accessTier;
        }

        public static bool IsHigherTierThan(this AccessTier currentAccess, AccessTier accessTier)
        {
            return currentAccess < accessTier;
        }
    }
}
