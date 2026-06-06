// cypress/e2e/account-list.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };

describe('Account List', () => {
  it('prikazuje listu računa', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: { content: [{ nazivRacuna: 'Tekući', brojRacuna: '111-1', currency: 'RSD', raspolozivoStanje: 50000, status: 'ACTIVE' }], totalElements: 1 } }).as('a');
    cy.visit('/accounts', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@a');
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });
});
