/**
 * PR_12 C12.16: aktuari + menjacnica + stock-exchange (Celina 3).
 */
describe('PR_12: Actuary + Exchange (employee)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('adminEmail'));
    cy.get('input[name=password]').type(Cypress.env('adminPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('admin vidi actuary-management portal', () => {
    cy.visit('/actuary-management');
    cy.contains(/aktuar/i).should('be.visible');
  });

  it('admin vidi stock-exchange listu', () => {
    cy.visit('/stock-exchange');
    cy.contains(/berza|exchange/i).should('be.visible');
  });

  it('admin vidi exchange rates (klijentski view ali admin moze)', () => {
    cy.visit('/exchange');
    cy.contains(/RSD|EUR|USD/i).should('be.visible');
  });
});
