// cypress/e2e/my-funds.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };
const POSITIONS = [{ fundId: 1, fundNaziv: 'Alpha Fund', totalInvested: 10000, currentPositionValue: 11000, clientProfit: 1000, percentageOfFund: 0.1, firstInvestedAt: '2025-01-01' }];

describe('My Funds', () => {
  it('prikazuje moje fondove', () => {
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: POSITIONS }).as('f');
    cy.visit('/funds/my-funds', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@f');
    cy.contains('Alpha Fund').should('be.visible');
  });
});
