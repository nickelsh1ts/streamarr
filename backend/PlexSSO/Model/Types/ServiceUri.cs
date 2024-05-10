using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(ServiceUriConverter))]
    public class ServiceUri : ValueType<string>
    {
        public ServiceUri(in string serviceUri) : base(serviceUri)
        {
        }
    }

    public class ServiceUriConverter : ValueTypeConverter<string, ServiceUri>
    {
    }
}
