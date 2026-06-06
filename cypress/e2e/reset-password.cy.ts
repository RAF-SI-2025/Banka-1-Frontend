// cypress/e2e/reset-password.cy.ts
describe('Reset Password Component', () => {

  it('treba da prikaže grešku ako nema tokena', () => {
    cy.visit('/auth/reset-password');
    cy.contains('Nevalidan link', { timeout: 15000 }).should('be.visible');
  });

  it('treba da prikaže formu ako je token validan', () => {
    cy.intercept('GET', /\/employees\/auth\/checkResetPassword/, { statusCode: 200, body: 123 }).as('checkToken');
    cy.visit('/auth/reset-password?token=valid-token');
    cy.wait('@checkToken');
    cy.contains('Postavite novu lozinku').should('be.visible');
  });

  it('treba uspešno da resetuje lozinku', () => {
    cy.intercept('GET', /\/employees\/auth\/checkResetPassword/, { statusCode: 200, body: 123 }).as('checkToken');
    cy.intercept('POST', /\/employees\/auth\/resetPassword/, { statusCode: 200, body: 'Lozinka uspešno resetovana' }).as('resetPassword');
    cy.visit('/auth/reset-password?token=valid-token');
    cy.wait('@checkToken');
    cy.get('input[name="password"]').type('NovaLozinka123!');
    cy.get('input[name="confirmPassword"]').type('NovaLozinka123!');
    cy.contains(/Resetuj lozinku/i).click();
    cy.wait('@resetPassword');
  });
});
