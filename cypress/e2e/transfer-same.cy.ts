// cypress/e2e/transfer-same.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };
const ACCOUNTS = { content: [
  { id: 1, accountNumber: '111-1', nazivRacuna: 'Tekući RSD', currency: 'RSD', raspolozivoStanje: 50000, stanjeRacuna: 50000, status: 'ACTIVE' },
  { id: 2, accountNumber: '111-2', nazivRacuna: 'Štedni RSD', currency: 'RSD', raspolozivoStanje: 30000, stanjeRacuna: 30000, status: 'ACTIVE' },
], totalElements: 2 };

describe('Transfer Same', () => {
  it('forma za transfer u istoj valuti', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCOUNTS }).as('a');
    cy.visit('/transfers/same', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@a');
    cy.get('[data-cy="transfer-same-form"]').should('be.visible');
  });
});
