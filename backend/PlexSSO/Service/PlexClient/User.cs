using PlexSSO.Model.Types;

namespace PlexSSO.Service.PlexClient
{
    public class User
    {
        public Username Username { get; }
        public Email Email { get; }
        public Thumbnail Thumbnail { get; }

        public User(string username, string email, string thumbnail)
        {
            Username = new Username(username, email);
            Email = new Email(email);
            Thumbnail = new Thumbnail(thumbnail);
        }
    }
}
