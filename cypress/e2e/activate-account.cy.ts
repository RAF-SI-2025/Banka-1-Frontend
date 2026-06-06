// cypress/e2e/activate-account.cy.ts
describe('Activate Account Component - Employee', () => {

  it('treba da prikaže grešku ako nema tokena', () => {
    cy.visit('/auth/activate-account');
    cy.contains('Nevalidan link', { timeout: 15000 }).should('be.visible');
  });

  it('treba da prikaže formu za kreiranje lozinke ako je token validan (employee)', () => {
    cy.intercept('GET', /\/employees\/auth\/checkActivate/, { statusCode: 200, body: 123 }).as('checkToken');
    cy.visit('/auth/activate-account?token=valid-token');
    cy.wait('@checkToken');
    cy.contains('Aktivirajte nalog').should('be.visible');
  });

  it('treba uspešno da aktivira employee nalog', () => {
    cy.intercept('GET', /\/employees\/auth\/checkActivate/, { statusCode: 200, body: 123 }).as('checkToken');
    cy.intercept('POST', /\/employees\/auth\/activate/, { statusCode: 200, body: 'Nalog uspešno aktiviran' }).as('activateAccount');
    cy.visit('/auth/activate-account?token=valid-token');
    cy.wait('@checkToken');
    cy.get('input[name="password"]').type('NovaLozinka123!');
    cy.get('input[name="confirmPassword"]').type('NovaLozinka123!');
    cy.contains(/Aktiviraj nalog/i).click();
    cy.wait('@activateAccount');
  });
});
