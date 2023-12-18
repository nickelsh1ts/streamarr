const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "ip2fwk",
  e2e: {
    // baseUrl: 'http://localhost:3000',
  },
  env: {
    ADMIN_EMAIL: "admin@sh1ts.dev",
    ADMIN_PASSWORD: "test1234",
    USER_EMAIL: "friend@sh1ts.dev",
    USER_PASSWORD: "test1234",
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
});
