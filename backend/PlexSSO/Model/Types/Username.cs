using System;
using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(UsernameConverter))]
    public class Username : ValueType<string>
    {
        public Username(in string username)
            : base(username)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                throw new ArgumentException("Provided username cannot be null or empty");
            }
        }

        public Username(in string username, in string email)
            : this(string.IsNullOrWhiteSpace(username) ? email : username)
        {
        }
    }

    public class UsernameConverter : ValueTypeConverter<string, Username>
    {
    }
}
