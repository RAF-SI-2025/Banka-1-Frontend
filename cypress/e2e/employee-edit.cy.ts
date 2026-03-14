// cypress/e2e/employee-edit.cy.ts
// E2E testovi za Employee Edit Modal komponentu

describe('Employee Edit Modal Component', () => {

  beforeEach(() => {
    // Intercept employees list API
    cy.intercept('GET', '**/employees*', (req) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return req.continue();
      }
      req.reply({
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              ime: 'Marko',
              prezime: 'Marković',
              email: 'marko@example.com',
              pozicija: 'Developer',
              departman: 'IT',
              aktivan: true,
              role: 'EmployeeBasic',
              permisije: ['Create', 'View']
            }
          ],
          totalElements: 1,
          totalPages: 1
        }
      });
    }).as('getEmployees');

    // Intercept update API
    cy.intercept('PUT', '**/employees/1', { statusCode: 200, body: {} }).as('updateEmployee');

    // Set auth
    window.localStorage.setItem('authToken', 'fake-jwt-token');
    window.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'admin@test.com', role: 'EmployeeAdmin', permissions: []
    }));

    cy.visit('/employees');
    cy.wait('@getEmployees');

    // Click edit button on first row to open modal
    cy.get('table tbody tr').first().find('.btn-icon').first().click();
  });

  it('treba da prikaže modal i automatski popuni polja starim podacima', () => {
    cy.get('.modal-overlay').should('be.visible');
    cy.get('.modal-header h2').should('contain', 'Edit employee');

    cy.get('input[formControlName="ime"]').should('have.value', 'Marko');
    cy.get('input[formControlName="prezime"]').should('have.value', 'Marković');
    cy.get('input[formControlName="email"]').should('have.value', 'marko@example.com');
  });

  it('treba da onemogući dugme Save ako je ime obrisano', () => {
    cy.get('input[formControlName="ime"]').clear();
    cy.get('.modal-header h2').click(); // trigger blur/touched

    cy.get('.btn-primary').should('be.disabled');
    cy.get('.field-error').should('be.visible');
  });

  it('treba da pošalje izmenjene podatke', () => {
    cy.get('input[formControlName="ime"]').clear().type('Marko Izmenjeni');

    cy.get('.btn-primary').should('not.be.disabled').click();

    cy.wait('@updateEmployee').then((interception) => {
      expect(interception.request.body.ime).to.equal('Marko Izmenjeni');
    });

    // Modal should close
    cy.get('.modal-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na Cancel', () => {
    cy.get('.btn-outline').contains('Cancel').click();
    cy.get('.modal-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na overlay', () => {
    cy.get('.modal-overlay').click('topLeft');
    cy.get('.modal-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na X dugme', () => {
    cy.get('.btn-close').click();
    cy.get('.modal-overlay').should('not.exist');
  });

});
