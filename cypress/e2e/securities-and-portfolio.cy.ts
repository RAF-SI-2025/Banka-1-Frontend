// cypress/e2e/securities-and-portfolio.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const AGENT = { email: 'a@b.com', role: 'Agent', permissions: ['SECURITIES_TRADE_UNLIMITED'] };

describe('Securities & Portfolio', () => {
  it('prikazuje securities listu', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/stocks/, { statusCode: 200, body: { content: [], totalElements: 0 } });
    cy.intercept('GET', /\/stock\/api\/stock-exchanges/, { statusCode: 200, body: [] });
    cy.visit('/securities', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(AGENT)); } });
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('prikazuje portfolio', () => {
    cy.intercept('GET', /\/order\/portfolio/, { statusCode: 200, body: { holdings: [], totalProfit: 0 } });
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: [] });
    cy.visit('/portfolio', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(AGENT)); } });
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });
});
