import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: '',
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
  env: {},
  retries: {
    runMode: 2,
    openMode: 0,
  },
});