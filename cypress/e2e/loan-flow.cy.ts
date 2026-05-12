/**
 * PR_12 C12.12: loan request flow (Celina 2).
 */
describe('PR_12: Krediti flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('klijent vidi listu svojih kredita', () => {
    cy.visit('/loans');
    cy.contains(/kredit|loan/i).should('be.visible');
  });

  it('klijent navigira na novi loan request', () => {
    cy.visit('/loans/request');
    cy.contains(/iznos|amount/i).should('be.visible');
  });
});

describe('PR_12: Loan management (employee)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('adminEmail'));
    cy.get('input[name=password]').type(Cypress.env('adminPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('admin vidi loan-request-management portal', () => {
    cy.visit('/loan-request-management');
    cy.contains(/zahtev|request/i).should('be.visible');
  });

  it('admin vidi loan-management portal', () => {
    cy.visit('/loan-management');
    cy.contains(/aktivan|active/i, { matchCase: false }).should('be.visible');
  });
});
