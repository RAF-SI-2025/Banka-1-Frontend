// cypress/e2e/otc-funds-flow.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['OTC_TRADE', 'BANKING_BASIC'] };

describe('OTC + Funds Flow', () => {
  it('prikazuje OTC portal', () => {
    cy.intercept('GET', /\/otc\/offers\/active/, { statusCode: 200, body: [] });
    cy.intercept('GET', /\/api\/interbank\/otc\/negotiations/, { statusCode: 200, body: [] });
    cy.intercept('GET', /\/otc\/contracts\/my/, { statusCode: 200, body: [] });
    cy.intercept('GET', /\/otc\/public-stocks/, { statusCode: 200, body: [] });
    cy.intercept('GET', /\/stocks\/price-feed/, { statusCode: 200, body: [] });
    cy.visit('/otc', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.contains('OTC Portal', { timeout: 15000 }).should('be.visible');
  });

  it('prikazuje fondove', () => {
    cy.intercept({ method: 'GET', url: /\/funds\b/ }, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') req.reply({ statusCode: 200, body: [{ id: 1, naziv: 'Alpha', opis: 'Test', minimumContribution: 1000, totalValue: 100000, profit: 5000, likvidnaSredstva: 20000 }] });
      else req.continue();
    });
    cy.visit('/funds', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.contains('Investicioni fondovi', { timeout: 15000 }).should('be.visible');
  });
});
