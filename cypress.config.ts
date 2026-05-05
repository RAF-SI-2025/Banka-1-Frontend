import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:4200',
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: process.env.CYPRESS_API_URL || 'http://localhost',
      clientEmail: process.env.CYPRESS_CLIENT_EMAIL || 'marko.markovic@banka.com',
      clientPassword: process.env.CYPRESS_CLIENT_PASSWORD || 'admin123',
      employeeEmail: process.env.CYPRESS_EMPLOYEE_EMAIL || 'petar.petrovic@banka.com',
      employeePassword: process.env.CYPRESS_EMPLOYEE_PASSWORD || 'admin123',
    },
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
