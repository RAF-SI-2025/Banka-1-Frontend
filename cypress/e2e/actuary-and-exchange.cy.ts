/**
 * PR_12 C12.16: aktuari + menjacnica + stock-exchange (Celina 3).
 */

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const ADMIN = { email: 'admin@banka.rs', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL', 'FUND_AGENT_MANAGE'] };

function visit(url: string) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN);
      win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN));
    },
  });
}

describe('PR_12: Actuary + Exchange (employee)', () => {

  it('admin vidi actuary-management portal', () => {
    cy.intercept('GET', /\/order\/actuaries\/agents/, { statusCode: 200, body: { content: [], totalElements: 0 } }).as('a');
    visit('/actuary-management');
    cy.wait('@a');
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('admin vidi stock-exchange listu', () => {
    cy.intercept('GET', /\/stock\/api\/stock-exchanges/, { statusCode: 200, body: [] }).as('ex');
    visit('/stock-exchange');
    cy.wait('@ex');
    cy.contains('h1', 'Berze', { timeout: 15000 }).should('be.visible');
  });

  it('admin vidi exchange rates (klijentski view ali admin moze)', () => {
    cy.intercept('GET', /\/exchange\/rates/, { statusCode: 200, body: [] }).as('r');
    visit('/exchange');
    cy.wait('@r');
    cy.contains('Kursna lista', { timeout: 15000 }).should('be.visible');
  });
});
