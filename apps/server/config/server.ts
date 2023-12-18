export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS", [
      "JsGKkP2gm4ide5dx2LF58w==",
      "0VjbRhl4k5OI/5Ws0za0Wg==",
      "XAif8q/TVBWuE5nem6vbFw==",
      "pnBtoF3fxW1eccwrS1jkjQ==",
    ]),
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
