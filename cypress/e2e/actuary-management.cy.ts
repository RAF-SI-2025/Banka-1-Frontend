// cypress/e2e/actuary-management.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['FUND_AGENT_MANAGE'] };
const AGENTS = { content: [{ employeeId: 1, ime: 'Petar', prezime: 'P', email: 'p@b.com', pozicija: 'Senior', limit: 500000, usedLimit: 0, needApproval: false }], totalElements: 1 };

function visit() {
  cy.intercept('GET', /\/actuaries\/agents/, { statusCode: 200, body: AGENTS }).as('a');
  cy.visit('/actuary-management', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR)); } });
  cy.wait('@a');
  cy.get('[data-cy="agents-table"]', { timeout: 15000 }).should('be.visible');
}

describe('Actuary Management', () => {
  it('prikazuje tabelu', () => { visit(); cy.get('[data-cy="agents-table"]').should('be.visible'); });
  it('filter email', () => { visit(); cy.get('[data-cy="filter-email"]').type('p'); cy.wait(500); cy.wait('@a'); });
  it('edit limit', () => { cy.intercept('PUT', /\/actuaries\/agents\/\d+\/limit/, { statusCode: 200 }); visit(); cy.get('[data-cy="edit-limit-btn"]').click(); cy.get('[data-cy="save-limit-btn"]').click(); });
  it('reset limit', () => { cy.intercept('PUT', /\/actuaries\/agents\/\d+\/reset-limit/, { statusCode: 200 }); visit(); cy.get('[data-cy="reset-limit-btn"]').click(); cy.get('[data-cy="confirm-reset-btn"]').click(); });
  it('bez tokena → /login', () => { cy.visit('/actuary-management', { onBeforeLoad(win: any) { win.localStorage.clear(); } }); cy.url().should('include', '/login'); });
});
