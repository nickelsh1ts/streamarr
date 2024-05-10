namespace PlexSSO.Model.API
{
    public class BasicResponse
    {
        public bool Success { get; }

        public BasicResponse(bool success)
        {
            Success = success;
        }
    }
}
