// cypress/e2e/employee-list.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const ADMIN = { email: 'a@b.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL'] };
const EMPS = { content: [
  { id: 1, ime: 'Marko', prezime: 'Marković', email: 'm@b.com', pozicija: 'Dev', departman: 'IT', aktivan: true, role: 'EmployeeBasic', permisije: [] },
  { id: 2, ime: 'Jelena', prezime: 'Jovanović', email: 'j@b.com', pozicija: 'Mgr', departman: 'HR', aktivan: false, role: 'EmployeeAdmin', permisije: [] },
], totalElements: 2, totalPages: 1 };

function visit() {
  cy.intercept({ method: 'GET', url: /\/employees\b/ }, (req) => {
    if (req.resourceType === 'xhr' || req.resourceType === 'fetch') { req.reply({ statusCode: 200, body: EMPS }); } else { req.continue(); }
  }).as('e');
  cy.visit('/employees', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN)); } });
  cy.wait('@e');
}

describe('Employee List', () => {
  it('prikazuje tabelu', () => { visit(); cy.get('table').should('be.visible'); cy.contains('Marko Marković').should('be.visible'); });
  it('Dodaj zaposlenog', () => { visit(); cy.contains('Dodaj zaposlenog').click(); cy.url().should('include', '/employees/new'); });
});
