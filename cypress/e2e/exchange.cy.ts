const TOKEN_CLIENT = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZXhwIjo5OTk5OTk5OTk5fQ.mock';

const CLIENT_USER = {
  email: 'klijent@banka.rs',
  role: 'Client',
  permissions: ['BANKING_BASIC'],
};

const MOCK_RATES = [
  { currencyCode: 'EUR', buyingRate: 117.50, sellingRate: 118.50 },
  { currencyCode: 'USD', buyingRate: 108.20, sellingRate: 109.20 },
  { currencyCode: 'CHF', buyingRate: 120.10, sellingRate: 121.10 },
];

describe('Exchange page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/exchange/rates**', { statusCode: 200, body: MOCK_RATES }).as('getRates');
    cy.visit('/exchange', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_CLIENT);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getRates');
  });

  it('should open exchange page successfully', () => {
    cy.url().should('include', '/exchange');
    cy.contains('Kursna lista').should('be.visible');
    cy.get('table').should('be.visible');
  });

  it('should render all required table headers', () => {
    cy.contains('th', 'Valuta').should('be.visible');
    cy.contains('th', 'ISO Oznaka').should('be.visible');
    cy.contains('th', 'Kupovni kurs').should('be.visible');
    cy.contains('th', 'Prodajni kurs').should('be.visible');
    cy.contains('th', 'Srednji kurs').should('be.visible');
  });

  it('should display exchange rows with data', () => {
    cy.get('tbody tr').should('have.length.at.least', 1);
    cy.contains('td', 'EUR').should('be.visible');
    cy.contains('td', 'USD').should('be.visible');
  });

  it('should show rate values for EUR', () => {
    cy.contains('tr', 'EUR').within(() => {
      cy.contains('117').should('be.visible');
    });
  });

  it('should show calculator tab', () => {
    cy.contains('Proveri ekvivalentnost').click();
    cy.url().should('include', '/exchange');
    cy.contains('Kursna lista').should('be.visible');
  });

  it('should switch back to rates tab', () => {
    cy.contains('Proveri ekvivalentnost').click();
    cy.contains('Kursna lista').click();
    cy.get('table').should('be.visible');
  });
});
