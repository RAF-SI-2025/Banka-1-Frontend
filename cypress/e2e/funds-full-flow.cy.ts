// cypress/e2e/funds-full-flow.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['FUND_AGENT_MANAGE'] };

describe('Funds Full Flow', () => {
  it('klijent vidi fondove', () => {
    cy.intercept({ method: 'GET', url: /\/funds\b/ }, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') req.reply({ statusCode: 200, body: [{ id: 1, naziv: 'Alpha', opis: 'Test', minimumContribution: 1000, totalValue: 100000, profit: 5000, likvidnaSredstva: 20000 }] });
      else req.continue();
    });
    cy.visit('/funds', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.contains('Investicioni fondovi', { timeout: 15000 }).should('be.visible');
  });

  it('supervizor vidi profit', () => {
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: [] });
    cy.intercept('GET', /\/funds\/bank-positions/, { statusCode: 200, body: [] });
    cy.visit('/funds/profit-banke', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR)); } });
    cy.contains('Profit Banke', { timeout: 15000 }).should('be.visible');
  });
});
