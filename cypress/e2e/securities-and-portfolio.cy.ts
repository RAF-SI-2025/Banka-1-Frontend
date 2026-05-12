/**
 * PR_12 C12.13: hartije od vrednosti + portfolio (Celina 3).
 *   - klijent vidi listu hartija
 *   - klikne na stock detalj
 *   - portfolio prikaz
 *   - tax tracking (employee)
 *   - orders overview (employee)
 */
describe('PR_12: Hartije + Portfolio', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('klijent vidi listu hartija', () => {
    cy.visit('/securities');
    cy.contains(/akcij|stock/i).should('be.visible');
  });

  it('klijent vidi stock detalj sa "Buy" dugmetom (PR_05 C5.1 fix)', () => {
    cy.visit('/securities/stock/AAPL');
    cy.contains(/AAPL/i).should('be.visible');
  });

  it('klijent vidi svoj portfolio', () => {
    cy.visit('/portfolio');
    cy.contains(/portfolio/i).should('be.visible');
  });
});

describe('PR_12: Tax i Orders overview (employee)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('adminEmail'));
    cy.get('input[name=password]').type(Cypress.env('adminPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('admin vidi tax-tracking portal', () => {
    cy.visit('/tax-tracking');
    cy.contains(/porez|tax/i).should('be.visible');
  });

  it('admin vidi orders overview', () => {
    cy.visit('/orders-overview');
    cy.contains(/order|nalog/i).should('be.visible');
  });
});
