// cypress/e2e/exchange.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };
const RATES = [
  { currencyCode: 'EUR', buyingRate: 117.50, sellingRate: 118.50 },
  { currencyCode: 'USD', buyingRate: 108.20, sellingRate: 109.20 },
];

describe('Exchange', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/exchange\/rates/, { statusCode: 200, body: RATES }).as('r');
    cy.visit('/exchange', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@r');
  });

  it('prikazuje kursnu listu', () => { cy.contains('Kursna lista').should('be.visible'); });
  it('tabela sa valutama', () => { cy.contains('td', 'EUR').should('be.visible'); cy.contains('td', 'USD').should('be.visible'); });
  it('kolone tabele', () => { cy.contains('th', 'Valuta').should('be.visible'); });
});
