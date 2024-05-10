namespace PlexSSO.Ombi.Plugin.Service.OmbiClient
{
    public class OmbiTokenResponse
    {
        public string AccessToken { get; set; } = "";
        public string Expiration { get; set; } = null;

        public override string ToString()
        {
            return $"AccessToken = {AccessToken}\n" +
                $"Expiration = {Expiration}";
        }
    }
}
