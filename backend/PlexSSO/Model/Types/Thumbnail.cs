using System.Text.Json.Serialization;

namespace PlexSSO.Model.Types
{
    [JsonConverter(typeof(ThumbnailConverter))]
    public class Thumbnail : ValueType<string>
    {
        public Thumbnail(in string thumbnail) : base(thumbnail)
        {
        }
    }

    public class ThumbnailConverter : ValueTypeConverter<string, Thumbnail>
    {
    }
}
