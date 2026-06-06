/**
 * PR_12 C12.15: pun investicioni-fond flow (Celina 4).
 *   - klijent vidi discovery
 *   - klijent vidi moje fondove
 *   - profit-banke i profit-aktuara stranice (admin)
 *   - create fund forma
 */

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.rs',
  role: 'Client',
  permissions: [],
};

const FUND_ADMIN_USER = {
  email: 'fundadmin@banka.rs',
  role: 'ADMIN',
  permissions: ['FUND_AGENT_MANAGE'],
};

function visitAs(url: string, user: object) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });
}

describe('PR_12: Investicioni fondovi pun flow', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/funds**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/funds/my-positions**', { statusCode: 200, body: [] });
  });

  it('klijent vidi discovery sa listom fondova', () => {
    visitAs('/funds', CLIENT_USER);
    cy.contains('Investicioni fondovi').should('be.visible');
  });

  it('klijent vidi "Moji fondovi" stranicu', () => {
    visitAs('/funds/my-funds', CLIENT_USER);
    cy.contains('Moji fondovi').should('be.visible');
  });
});

describe('PR_12: Profit Banke i Aktuara (admin)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/funds**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/profit**', { statusCode: 200, body: { totalProfit: 0 } });
    cy.intercept('GET', '**/funds/profit**', { statusCode: 200, body: { totalProfit: 0, actuaryProfit: 0 } });
  });

  it('admin vidi Profit Banke stranicu', () => {
    visitAs('/funds/profit-banke', FUND_ADMIN_USER);
    cy.contains('Profit Banke').should('be.visible');
    cy.contains(/Ukupan profit/i).should('be.visible');
  });

  it('admin vidi Profit Aktuara stranicu', () => {
    visitAs('/funds/profit-aktuara', FUND_ADMIN_USER);
    cy.contains('Profit aktuara', { matchCase: false }).should('be.visible');
  });

  it('admin moze da pristupi create fund formi', () => {
    visitAs('/funds/create', FUND_ADMIN_USER);
    cy.contains('Kreiraj investicioni fond').should('be.visible');
    cy.get('input[formcontrolname=naziv]').should('be.visible');
  });
});
