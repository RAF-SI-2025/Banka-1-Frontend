// cypress/e2e/payment-recipients.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };

describe('Payment Recipients', () => {
  it('stranica se ucitava', () => {
    cy.visit('/payments/recipients', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('API intercept radi', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: { content: [] } });
    cy.visit('/payments/recipients', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('bez tokena → /login', () => {
    cy.visit('/payments/recipients', { onBeforeLoad(win: any) { win.localStorage.clear(); } });
    cy.url().should('include', '/login');
  });
});
