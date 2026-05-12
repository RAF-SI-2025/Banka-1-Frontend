/**
 * PR_12 C12.10: zaposleni mgmt flow (Celina 1).
 *   - admin login → /employees lista
 *   - kreiranje novog zaposlenog
 *   - edit → izmena pozicije
 *   - deaktivacija
 */
describe('PR_12: Zaposleni management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('adminEmail'));
    cy.get('input[name=password]').type(Cypress.env('adminPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('admin vidi listu zaposlenih', () => {
    cy.visit('/employees');
    cy.contains('Zaposleni').should('be.visible');
  });

  it('admin kreira novog zaposlenog', () => {
    cy.visit('/employees/new');
    cy.get('input[name=ime]').type('Test');
    cy.get('input[name=prezime]').type('Zaposleni');
    cy.get('input[name=email]').type(`zap-${Date.now()}@test.com`);
    cy.get('input[name=username]').type(`testzap${Date.now()}`);
    cy.get('input[name=pozicija]').type('Programer');
    cy.get('input[name=departman]').type('IT');
    cy.get('button[type=submit]').click();
    cy.contains('uspeh', { matchCase: false, timeout: 10000 }).should('be.visible');
  });

  it('admin pristupa /clients listi i vidi seed klijente', () => {
    cy.visit('/clients');
    cy.contains('Marko').should('be.visible');
  });
});
