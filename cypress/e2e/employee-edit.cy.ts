// cypress/e2e/employee-edit.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const ADMIN = { email: 'a@b.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL'] };

describe('Employee Edit', () => {
  it('otvara edit modal', () => {
    cy.intercept({ method: 'GET', url: /\/employees\b/ }, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') req.reply({ statusCode: 200, body: { content: [{ id: 1, ime: 'Marko', prezime: 'Marković', email: 'm@b.com', pozicija: 'Dev', departman: 'IT', aktivan: true, role: 'EmployeeBasic', permisije: [] }], totalElements: 1 } });
      else req.continue();
    }).as('e');
    cy.visit('/employees', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN)); } });
    cy.wait('@e');
    cy.get('button[title="Izmeni"]').first().click();
    cy.get('.z-modal').should('be.visible');
  });
});
