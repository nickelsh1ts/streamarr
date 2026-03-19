import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'ou397k',
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
  env: {
    ADMIN_EMAIL: 'admin@streamarr.dev',
    ADMIN_PASSWORD: 'test1234',
    USER_EMAIL: 'friend@streamarr.dev',
    USER_PASSWORD: 'test1234',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  defaultCommandTimeout: 10000,
});
