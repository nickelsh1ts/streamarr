using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(ServiceNameConverter))]
    public class ServiceName : ValueType<string>
    {
        public ServiceName(in string serviceName) : base(serviceName)
        {
        }
    }

    public class ServiceNameConverter : ValueTypeConverter<string, ServiceName>
    {
    }
}
