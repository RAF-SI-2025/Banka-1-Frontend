/**
 * PR_09 C9.3: Cypress live test za OTC i Funds flow (PR_04 spec).
 */
describe('PR_04: OTC i Funds portali', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('OTC: aktivne ponude stranica se otvara', () => {
    cy.visit('/otc');
    cy.contains('Aktivne ponude', { matchCase: false }).should('be.visible');
  });

  it('OTC: kreiranje nove ponude redirektuje nazad na /otc/offers', () => {
    cy.visit('/otc/create');
    cy.get('input[formcontrolname=stockTicker]').type('AAPL');
    cy.get('input[formcontrolname=sellerId]').type('2');
    cy.get('input[formcontrolname=amount]').type('10');
    cy.get('input[formcontrolname=pricePerStock]').type('150');
    cy.get('input[formcontrolname=premium]').type('400');
    cy.get('input[formcontrolname=settlementDate]').type('2027-12-31');
    cy.contains('button', 'Posalji ponudu').click();
    cy.url({ timeout: 10000 }).should('include', '/otc/offers');
  });

  it('Funds: discovery prikazuje listu fondova', () => {
    cy.visit('/funds');
    cy.contains('Investicioni fondovi').should('be.visible');
  });

  it('Funds: profit-banke portal pokazuje total profit', () => {
    cy.visit('/funds/profit-banke');
    cy.contains('Profit Banke').should('be.visible');
    cy.contains('Ukupan profit:').should('be.visible');
  });
});
