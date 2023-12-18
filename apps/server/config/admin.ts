export default ({ env }) => ({
  auth: {
    events: {
      onConnectionSuccess(e) {
        console.log(e.user, e.provider);
      },
      onConnectionError(e) {
        console.error(e.error, e.provider);
      },
    },
    options: {
      expiresIn: "7d",
    },
    secret: env("ADMIN_JWT_SECRET", "qIIDodKJioeZ9MrkKDTgdA=="),
  },
  url: env("PUBLIC_ADMIN_URL", "/admin"),
  autoOpen: false,
  apiToken: {
    salt: env("API_TOKEN_SALT", "0Jkya6iauiRUzG2jM/5XMg=="),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT", "794p+YV0Yp0ggrsVC7Ksqw=="),
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
  serveAdminPanel: env.bool("SERVE_ADMIN", true),
});
