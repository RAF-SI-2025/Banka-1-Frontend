// cypress/e2e/forgot-password.cy.ts
describe('Forgot Password', () => {
  beforeEach(() => { cy.visit('/auth/forgot-password'); });

  it('prikazuje formu', () => {
    cy.contains('Zaboravljena lozinka').should('be.visible');
    cy.get('input[type="email"]').should('exist');
  });

  it('uspešan submit', () => {
    cy.intercept('POST', /\/employees\/auth\/forgot-password/, { statusCode: 200 }).as('fp');
    cy.get('input[type="email"]').type('t@t.com');
    cy.get('button[type="submit"]').click();
    cy.wait('@fp');
    cy.contains('Proverite email').should('be.visible');
  });

  it('nazad na login', () => {
    cy.contains(/Nazad na prijavu/i).click();
    cy.url().should('include', '/login');
  });
});
