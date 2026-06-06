// cypress/e2e/margin-flow.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: [] };

describe('Margin Flow', () => {
  it('prikazuje marzni portal', () => {
    cy.intercept('GET', /\/accounts\/getMarginUser/, { statusCode: 200, body: { accountNumber: '555-1', userId: 77, initialMargin: 50000, loanValue: 0, maintenanceMargin: 25000, active: true } }).as('m');
    cy.intercept('GET', /\/transactions\/getAllMarginTransactions/, { statusCode: 200, body: [] });
    cy.visit('/margin', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('access_token', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait(['@m'], { timeout: 15000 });
    cy.contains(/margin|marž|aktiv/i).should('be.visible');
  });
});
