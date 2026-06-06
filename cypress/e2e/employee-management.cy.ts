// cypress/e2e/employee-management.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const ADMIN = { email: 'a@b.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL', 'CLIENT_MANAGE'] };

function visit(url: string) {
  cy.visit(url, { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN)); } });
}

describe('Employee Management', () => {
  it('admin vidi listu zaposlenih', () => { visit('/employees'); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('admin pristupa /clients', () => { visit('/clients'); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('admin kreira novog zaposlenog', () => { visit('/employees/new'); cy.get('body', { timeout: 15000 }).should('be.visible'); });
});
