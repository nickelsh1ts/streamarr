namespace PlexSSO.Service.Config
{
    public interface IConfigurationService<out T>
    {
        T Config { get; }
        string GetConfigurationDirectory();
    }
}
