export default ({ env }) => [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "market-assets.strapi.io",
            env.array("ORIGINS_ARRAY"),
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "market-assets.strapi.io",
            env.array("ORIGINS_ARRAY"),
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      origin: env.array("ORIGINS_ARRAY", ["*"]),
      methods: env.array("METHODS_ARRAY", [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
      ]),
      headers: env.array("HEADERS_ARRAY"),
      keepHeaderOnError: true,
    },
  },
  {
    name: "strapi::poweredBy",
    config: {
      poweredBy: env.bool("POWERED_BY"),
    },
  },
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  {
    name: "strapi::session",
    config: {
      rolling: true,
      renew: true,
      secure: true,
      maxAge: 86400000,
    },
  },
  {
    name: "strapi::public",
    config: {
      defer: true,
      index: env("INDEX_PATH", "index-dev.html"),
    },
  },
  {
    name: "strapi::favicon",
    config: {
      path: "favicon.ico",
    },
  },
  { resolve: "../src/middlewares/admin-redirect" },
];
