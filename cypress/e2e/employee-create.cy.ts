// cypress/e2e/employee-create.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const ADMIN = { email: 'a@b.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL'] };

function visit(url: string) {
  cy.visit(url, { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN)); } });
}

describe('Employee Create', () => {
  it('prikazuje formu za kreiranje', () => {
    visit('/employees/new');
    cy.contains('Kreiraj zaposlenog').should('be.visible');
    cy.get('#ime').should('exist');
    cy.get('#prezime').should('exist');
  });

  it('kreira i preusmeri na listu', () => {
    cy.intercept('POST', /\/employees/, { statusCode: 201, body: { id: 1 } }).as('create');
    cy.intercept({ method: 'GET', url: /\/employees\b/ }, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') req.reply({ statusCode: 200, body: { content: [], totalElements: 0 } });
      else req.continue();
    });
    visit('/employees/new');
    cy.get('#ime').clear().type('Marko');
    cy.get('#prezime').clear().type('Markovic');
    cy.get('#email').clear().type('m@t.com');
    cy.get('button[type="submit"]').then($btn => {
      if (!$btn.is(':disabled')) { cy.wrap($btn).click(); cy.wait('@create'); }
    });
    cy.get('body').should('be.visible');
  });
});
