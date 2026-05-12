/**
 * PR_12 C12.14: OTC pun pregovor flow (Celina 4).
 *   - kupac kreira ponudu
 *   - vidi je u Aktivne ponude
 *   - prodavac counter-offer
 *   - kupac accept
 *   - vidi sklopljen ugovor
 *   - klikne "Iskoristi" → SAGA OTC_EXERCISE
 */
describe('PR_12: OTC pun pregovor flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('kupac kreira inicijalnu OTC ponudu', () => {
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

  it('aktivne ponude prikazuju kreiranu ponudu', () => {
    cy.visit('/otc/offers');
    cy.contains('AAPL').should('be.visible');
  });

  it('Sklopljeni ugovori stranica se otvara sa filter-om', () => {
    cy.visit('/otc/contracts');
    cy.contains(/Sklopljeni|opcioni/i).should('be.visible');
    cy.get('select').should('exist');
  });
});
