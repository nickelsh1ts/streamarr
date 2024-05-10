using System;
using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(AccessTokenConverter))]
    public class AccessToken : ValueType<string>
    {
        public AccessToken(in string token) : base(token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ArgumentException("Provided token cannot be null or empty");
            }
        }
    }

    public class AccessTokenConverter : ValueTypeConverter<string, AccessToken>
    {
    }
}
