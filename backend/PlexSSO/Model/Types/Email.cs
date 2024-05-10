using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(EmailConverter))]
    public class Email : ValueType<string>
    {
        public Email(in string email) : base(email)
        {
        }
    }

    public class EmailConverter : ValueTypeConverter<string, Email>
    {
    }
}
