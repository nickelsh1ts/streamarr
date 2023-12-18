export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS"),
  },
  emitErrors: false,
  url: env("PUBLIC_URL"),
  proxy: env.bool("IS_PROXIED", true),
  cron: {
    enabled: env.bool("CRON_ENABLED", false),
  },
  webhooks: {
    populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
  },
  dirs: {
    public: "../../public",
  },
});
