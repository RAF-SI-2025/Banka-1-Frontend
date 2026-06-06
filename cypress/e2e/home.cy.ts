// cypress/e2e/home.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };

describe('Home', () => {
  it('prikazuje home stranicu', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: { content: [], totalElements: 0 } });
    cy.intercept('GET', /\/exchange\/rates/, { statusCode: 200, body: [] });
    cy.visit('/home', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.get('app-topbar', { timeout: 15000 }).should('be.visible');
  });
});
