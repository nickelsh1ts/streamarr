import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: '',
  e2e: {
    baseUrl: 'http://localhost:6064',
    experimentalSessionAndOrigin: true,
  },
  env: {
    ADMIN_EMAIL: 'admin@streamarr.dev',
    ADMIN_PASSWORD: 'test1234',
    USER_EMAIL: 'friend@streamarr.dev',
    USER_PASSWORD: 'test1234',
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
});
