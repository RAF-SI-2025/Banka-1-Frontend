// cypress/e2e/loan-flow.cy.ts
/**
 * PR_12 C12.12: loan request flow (Celina 2).
 */
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: [] };
const ADMIN = { email: 'a@b.com', role: 'EmployeeAdmin', permissions: ['CLIENT_MANAGE'] };

function visit(url: string, user: object) {
  cy.visit(url, { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(user)); } });
}

describe('PR_12: Krediti flow', () => {
  it('klijent vidi listu kredita', () => { visit('/loans', CLIENT); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('klijent navigira na loan request', () => { visit('/loans/request', CLIENT); cy.get('body', { timeout: 15000 }).should('be.visible'); });
});

describe('PR_12: Loan management (employee)', () => {
  it('admin vidi loan-request-management', () => { visit('/loan-request-management', ADMIN); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('admin vidi loan-management', () => { visit('/loan-management', ADMIN); cy.get('body', { timeout: 15000 }).should('be.visible'); });
});
