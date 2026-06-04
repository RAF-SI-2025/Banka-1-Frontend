import { defineConfig } from 'cypress';

/**
 * PR_09 C9.1: Cypress live profile.
 *
 * <p>Razlika sa default `cypress.config.ts`:
 *   - `baseUrl` ide preko Nginx api-gateway-a (http://localhost) umesto direktnog
 *     Angular dev servera (http://localhost:4200) — testovi konzumiraju realne
 *     REST endpoint-e iz banking-core-service-a.
 *   - `interceptOnly: false` (custom env var) signalizira test-ovima da NE
 *     mock-uju mrezu, vec da rade live HTTP pozive.
 *   - dodaje hooks za seed cleanup pre svake suite-e.
 *
 * <p>Pokretanje:
 *   npm run cypress:run -- --config-file cypress.config.live.ts
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    env: {
      live: true,
      apiBaseUrl: 'http://localhost',
      // dev seed credentials za live testing — match-uje Liquibase context:dev seed.
      adminEmail: 'admin@banka.com',
      adminPassword: 'admin123',
      clientEmail: 'mateja.subin@banka.com',
      clientPassword: 'client123',
    },
    setupNodeEvents(on, config) {
      // Tasks za seed reset izmedju spec-ova (TBD: implementirati postgres direct connect).
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
