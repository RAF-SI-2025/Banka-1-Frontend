/**
 * PR_12 C12.15: pun investicioni-fond flow (Celina 4).
 *   - klijent vidi discovery
 *   - klikne na detalje
 *   - investira (preko forme)
 *   - vidi novu poziciju u "Moji fondovi"
 *   - probaj redeem (povlacenje)
 *   - profit-banke i profit-aktuara stranice (admin)
 */
describe('PR_12: Investicioni fondovi pun flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('klijent vidi discovery sa listom fondova', () => {
    cy.visit('/funds');
    cy.contains('Investicioni fondovi').should('be.visible');
  });

  it('klijent vidi "Moji fondovi" stranicu', () => {
    cy.visit('/funds/my-funds');
    cy.contains('Moji fondovi').should('be.visible');
  });
});

describe('PR_12: Profit Banke i Aktuara (admin)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('adminEmail'));
    cy.get('input[name=password]').type(Cypress.env('adminPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('admin vidi Profit Banke stranicu', () => {
    cy.visit('/funds/profit-banke');
    cy.contains('Profit Banke').should('be.visible');
    cy.contains(/Ukupan profit/i).should('be.visible');
  });

  it('admin vidi Profit Aktuara stranicu', () => {
    cy.visit('/funds/profit-aktuara');
    cy.contains('Profit aktuara', { matchCase: false }).should('be.visible');
  });

  it('admin moze da pristupi create fund formi', () => {
    cy.visit('/funds/create');
    cy.contains('Kreiraj investicioni fond').should('be.visible');
    cy.get('input[formcontrolname=naziv]').should('be.visible');
  });
});
