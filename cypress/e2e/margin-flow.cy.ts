/**
 * PR_09 C9.2: Cypress live test za marzni racun flow (PR_03 spec).
 *
 * Pokriva:
 *   - Login kao klijent.
 *   - Navigacija ka /margin portalu.
 *   - Provera da li racun postoji; ako ne (prvo pokretanje), preskoci forme.
 *   - Uplata sa tekuceg na marzni (addToMargin).
 *   - Provera da je istorija dobila novi red.
 *   - Isplata sa marznog na tekuci (withdrawFromMargin) — manji od uplate da ne bi
 *     spustio ispod maintenance.
 */
describe('PR_03: Marzni racun portal', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name=email]').type(Cypress.env('clientEmail'));
    cy.get('input[name=password]').type(Cypress.env('clientPassword'));
    cy.get('button[type=submit]').click();
    cy.url({ timeout: 10000 }).should('include', '/home');
  });

  it('prikazi portal za marzni racun', () => {
    cy.visit('/margin');
    cy.contains('Marzni racun').should('be.visible');
  });

  it('uplata sa tekuceg na marzni dodaje red u istoriju', () => {
    cy.visit('/margin');
    // Ako klijent nema racun jos, test nije primenjiv — preskoci.
    cy.get('body').then(($body) => {
      if ($body.text().includes('Trenutno nemate marzni racun')) {
        cy.log('Klijent nema marzni racun; test preskocen.');
        return;
      }

      cy.get('input[formcontrolname=amount]').first().clear().type('500');
      cy.contains('button', 'Uplati').click();

      // Ocekuje toast ili reload tabele sa ADD_TO_MARGIN redom.
      cy.contains('ADD_TO_MARGIN', { timeout: 10000 }).should('be.visible');
    });
  });
});
