// cypress/e2e/employee-account-create.cy.ts
// Placeholder — needs Complex form flow, keep minimal
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';

describe('Account Create', () => {
  it('štiti rutu bez tokena', () => {
    cy.visit('/accounts/new', { onBeforeLoad(win: any) { win.localStorage.clear(); } });
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});
