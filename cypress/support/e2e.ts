// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Don't fail the test suite on Angular's benign ResizeObserver warning,
// nor on uncaught HTTP errors that the app already surfaces in the UI -
// we want assertion failures to come from explicit expect(), not from
// a side-effect exception bubbling out of NgZone.
Cypress.on('uncaught:exception', (err) => {
  if (/ResizeObserver|Non-Error promise rejection/.test(err.message)) {
    return false;
  }
  return true;
});