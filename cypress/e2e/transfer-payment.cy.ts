// cypress/e2e/transfer-payment.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };
const ACCOUNTS = { content: [{ accountNumber: '111-1', nazivRacuna: 'Tekući', currency: 'RSD', raspolozivoStanje: 50000, stanjeRacuna: 50000, status: 'ACTIVE' }] };

describe('Transfer & Payment', () => {
  it('prikazuje payment formu', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCOUNTS }).as('a');
    cy.visit('/accounts/payment/new', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@a');
    cy.contains('NOVO PLAĆANJE').should('be.visible');
  });

  it('prikazuje transfer same formu', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCOUNTS }).as('a');
    cy.visit('/transfers/same', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@a');
    cy.get('[data-cy="transfer-same-form"]').should('be.visible');
  });
});
