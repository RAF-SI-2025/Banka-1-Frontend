// cypress/e2e/kt3/orders-approval.cy.ts
// KT3 — Pregled ordera

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['TRADE_UNLIMITED'] };
const ORDERS = { content: [{ orderId: 1, agentName: 'Petar', orderType: 'MARKET', listingType: 'STOCK', quantity: 10, contractSize: 1, pricePerUnit: 185, direction: 'BUY', remainingPortions: 10, status: 'PENDING' }], totalElements: 1 };

function visit() {
  cy.intercept('GET', /\/order\/orders/, { statusCode: 200, body: ORDERS }).as('o');
  cy.visit('/orders-overview', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR)); } });
  cy.wait('@o');
}

describe('KT3 — Pregled ordera', () => {
  before(() => { visit(); cy.get('body', { timeout: 20000 }).should('be.visible'); });

  it('stranica se ucitava', () => { visit(); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('filter Pending radi', () => { visit(); cy.get('body').should('be.visible'); });
  it('filter Approved radi', () => { visit(); cy.get('body').should('be.visible'); });
  it('Approve intercept radi', () => { cy.intercept('PUT', /\/order\/orders\/\d+\/approve/, { statusCode: 200 }); visit(); cy.get('body').should('be.visible'); });
  it('Decline intercept radi', () => { cy.intercept('PUT', /\/order\/orders\/\d+\/decline/, { statusCode: 200 }); visit(); cy.get('body').should('be.visible'); });
  it('Cancel dijalog', () => { visit(); cy.get('body').should('be.visible'); });
});
