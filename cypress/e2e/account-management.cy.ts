// cypress/e2e/account-management.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const ADMIN = { email: 'a@b.com', role: 'EmployeeAdmin', permissions: ['CLIENT_MANAGE'] };

describe('Account Management', () => {
  it('prikazuje listu računa', () => {
    cy.intercept('GET', /\/accounts\/employee\/accounts/, { statusCode: 200, body: { content: [], totalElements: 0 } }).as('a');
    cy.visit('/account-management', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN)); } });
    cy.wait('@a');
    cy.contains(/račun|account/i).should('be.visible');
  });

  it('bez tokena → /login', () => {
    cy.visit('/account-management', { onBeforeLoad(win: any) { win.localStorage.clear(); } });
    cy.url().should('include', '/login');
  });
});
