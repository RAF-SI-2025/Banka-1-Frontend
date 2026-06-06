/**
 * PR_12 C12.11: payment + transfer flows (Celina 2).
 *   - klijent vidi svoje racune
 *   - kreira novo placanje
 *   - inicira transfer ka istom korisniku (transfers/same)
 *   - inicira transfer ka drugom korisniku (transfers/different)
 */

const TOKEN_CLIENT = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZXhwIjo5OTk5OTk5OTk5fQ.mock';

const CLIENT_USER = {
  email: 'klijent@banka.rs',
  role: 'Client',
  permissions: ['BANKING_BASIC'],
};

function visitAs(url: string) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_CLIENT);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

describe('PR_12: Transfer i placanje flows', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/accounts/client/accounts**', {
      statusCode: 200,
      body: {
        content: [
          { id: 1, accountNumber: '265000000000123456', currency: 'RSD', balance: 250000, status: 'ACTIVE' },
          { id: 2, accountNumber: '265000000000654321', currency: 'EUR', balance: 5000, status: 'ACTIVE' },
        ],
        totalElements: 2,
        totalPages: 1,
      },
    }).as('getAccounts');
    cy.intercept('GET', '**/payments**', { statusCode: 200, body: { content: [], totalElements: 0 } });
  });

  it('klijent vidi svoje racune', () => {
    visitAs('/accounts');
    cy.contains(/RSD|EUR/, { matchCase: false }).should('be.visible');
  });

  it('klijent navigira na transfer izmedju svojih racuna', () => {
    cy.intercept('GET', '**/accounts/client/accounts**', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 1 },
    });
    visitAs('/transfers/same');
    cy.contains('Transfer', { matchCase: false }).should('be.visible');
  });

  it('klijent navigira na transfer ka drugom korisniku', () => {
    cy.intercept('GET', '**/accounts/client/accounts**', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 1 },
    });
    visitAs('/transfers/different');
    cy.contains('Transfer', { matchCase: false }).should('be.visible');
  });

  it('klijent vidi listu placanja', () => {
    visitAs('/payments');
    cy.contains(/placanje|payment/i).should('be.visible');
  });

  it('klijent kreira novo placanje (forma se otvara)', () => {
    visitAs('/accounts/payment/new');
    cy.contains(/Iznos|amount/i).should('be.visible');
  });
});
