// cypress/e2e/orders-overview.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['TRADE_UNLIMITED'] };

describe('Orders Overview', () => {
  it('prikazuje tabelu ordera', () => {
    cy.intercept('GET', /\/order\/orders/, { statusCode: 200, body: { content: [{ orderId: 1, agentName: 'Petar', orderType: 'MARKET', listingType: 'STOCK', quantity: 10, contractSize: 1, pricePerUnit: 185, direction: 'BUY', remainingPortions: 10, status: 'PENDING' }], totalElements: 1 } }).as('o');
    cy.visit('/orders-overview', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR)); } });
    cy.wait('@o');
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('bez tokena → /login', () => {
    cy.visit('/orders-overview', { onBeforeLoad(win: any) { win.localStorage.clear(); } });
    cy.url().should('include', '/login');
  });
});
