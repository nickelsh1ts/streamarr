using System;
using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(ServerIdentifierConverter))]
    public class ServerIdentifier : ValueType<string>
    {
        public ServerIdentifier(in string id) : base(id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("Provided identifier cannot be null or empty");
            }
        }
    }

    public class ServerIdentifierConverter : ValueTypeConverter<string, ServerIdentifier>
    {
    }
}
