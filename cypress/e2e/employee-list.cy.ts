// cypress/e2e/employee-list.cy.ts
// E2E testovi za Employee List komponentu

const MOCK_EMPLOYEES = {
  content: [
    { id: 1, ime: 'Marko', prezime: 'Marković', email: 'marko@example.com', pozicija: 'Developer', departman: 'IT', aktivan: true, role: 'EmployeeBasic', permisije: [] },
    { id: 2, ime: 'Jelena', prezime: 'Jovanović', email: 'jelena@example.com', pozicija: 'Manager', departman: 'HR', aktivan: false, role: 'EmployeeAdmin', permisije: [] }
  ],
  totalElements: 2,
  totalPages: 1
};

describe('Employee List Component', () => {

  beforeEach(() => {
    // Intercept employees API
    cy.intercept('GET', '**/employees*', (req) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return req.continue();
      }
      req.reply({ statusCode: 200, body: MOCK_EMPLOYEES });
    }).as('getEmployees');

    // Set auth token to bypass guard
    window.localStorage.setItem('authToken', 'fake-jwt-token');
    window.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'admin@test.com', role: 'EmployeeAdmin', permissions: []
    }));

    cy.visit('/employees');
    cy.wait('@getEmployees');
  });

  it('treba da prikaže listu zaposlenih u tabeli', () => {
    cy.get('table tbody tr').should('have.length', 2);
    cy.get('table tbody tr').first().should('contain', 'Marko Marković');
  });

  it('treba da prikaže status badge za svakog zaposlenog', () => {
    cy.get('table tbody tr').first().find('.badge-success').should('contain', 'Active');
    cy.get('table tbody tr').last().find('.badge-danger').should('contain', 'Inactive');
  });

  it('treba da prikaže role badge', () => {
    cy.get('table tbody tr').first().find('.badge-role').should('contain', 'EmployeeBasic');
  });

  it('treba da izvrši pretragu kada se ukuca u search input', () => {
    cy.intercept('GET', '**/employees/search*', {
      statusCode: 200,
      body: {
        content: [MOCK_EMPLOYEES.content[1]],
        totalElements: 1,
        totalPages: 1
      }
    }).as('searchEmployees');

    cy.get('.search-input').type('jelena');

    // Wait for debounce (350ms) + API call
    cy.wait('@searchEmployees');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').first().should('contain', 'jelena@example.com');
  });

  it('treba da preusmeri na formu za kreiranje kada se klikne na "Add employee"', () => {
    cy.get('.btn-primary').contains('Add employee').click();
    cy.url().should('include', '/employees/new');
  });

  it('treba da sakrije delete dugme za admin korisnike', () => {
    // Marko is EmployeeBasic - should have delete button
    cy.get('table tbody tr').first().find('.btn-icon-danger').should('exist');

    // Jelena is EmployeeAdmin - should NOT have delete button
    cy.get('table tbody tr').last().find('.btn-icon-danger').should('not.exist');
  });

  it('treba da obriše zaposlenog kada se klikne na delete dugme', () => {
    cy.intercept('DELETE', '**/employees/1', { statusCode: 200 }).as('deleteEmployee');

    // Re-intercept GET for after delete
    cy.intercept('GET', '**/employees*', (req) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return req.continue();
      }
      req.reply({
        statusCode: 200,
        body: {
          content: [MOCK_EMPLOYEES.content[1]],
          totalElements: 1,
          totalPages: 1
        }
      });
    }).as('getEmployeesAfterDelete');

    cy.get('table tbody tr').first().find('.btn-icon-danger').click();

    cy.wait('@deleteEmployee');
    cy.wait('@getEmployeesAfterDelete');
  });

  it('treba da otvori edit modal kada se klikne na edit dugme', () => {
    cy.get('table tbody tr').first().find('.btn-icon').first().click();
    cy.get('app-employee-edit-modal').should('exist');
    cy.get('.modal-overlay').should('be.visible');
  });

  it('treba da prikaže pagination info', () => {
    cy.get('.pagination').should('exist');
    cy.get('.pagination-range').should('contain', 'of 2');
  });

});
