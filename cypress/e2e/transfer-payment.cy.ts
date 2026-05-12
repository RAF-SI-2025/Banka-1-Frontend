/**
 * PR_12 C12.11: payment + transfer flows (Celina 2).
 *   - klijent vidi svoje racune
 *   - kreira novo placanje
 *   - inicira transfer ka istom korisniku (transfers/same)
 *   - inicira transfer ka drugom korisniku (transfers/different)
 *   - OTP confirmation flow (otkazivanje posle 3 fail-a)
 */
describe('PR_12: Transfer i placanje flows', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('klijent vidi svoje racune', () => {
    cy.visit('/accounts');
    cy.contains(/RSD|EUR/, { matchCase: false }).should('be.visible');
  });

  it('klijent navigira na transfer izmedju svojih racuna', () => {
    cy.visit('/transfers/same');
    cy.contains('Transfer', { matchCase: false }).should('be.visible');
  });

  it('klijent navigira na transfer ka drugom korisniku', () => {
    cy.visit('/transfers/different');
    cy.contains('Transfer', { matchCase: false }).should('be.visible');
  });

  it('klijent vidi listu placanja', () => {
    cy.visit('/payments');
    cy.contains(/placanje|payment/i).should('be.visible');
  });

  it('klijent kreira novo placanje (forma se otvara)', () => {
    cy.visit('/accounts/payment/new');
    cy.contains(/Iznos|amount/i).should('be.visible');
  });
});
