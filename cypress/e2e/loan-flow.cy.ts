/**
 * PR_12 C12.12: loan request flow (Celina 2).
 */

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.rs',
  role: 'Client',
  permissions: [],
};

const EMPLOYEE_USER = {
  email: 'admin@banka.rs',
  role: 'ADMIN',
  permissions: ['CLIENT_MANAGE'],
};

function visitAs(url: string, user: object) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });
}

describe('PR_12: Krediti flow', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/credit/api/loans**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/loans**', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } });
  });

  it('klijent vidi listu svojih kredita', () => {
    visitAs('/loans', CLIENT_USER);
    cy.contains(/kredit|loan/i).should('be.visible');
  });

  it('klijent navigira na novi loan request', () => {
    visitAs('/loans/request', CLIENT_USER);
    cy.contains(/iznos|amount/i).should('be.visible');
  });
});

describe('PR_12: Loan management (employee)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/credit/api/loans**', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 },
    });
    cy.intercept('GET', '**/loan-request**', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } });
  });

  it('admin vidi loan-request-management portal', () => {
    visitAs('/loan-request-management', EMPLOYEE_USER);
    cy.contains(/zahtev|request/i).should('be.visible');
  });

  it('admin vidi loan-management portal', () => {
    visitAs('/loan-management', EMPLOYEE_USER);
    cy.contains(/aktivan|active/i, { matchCase: false }).should('be.visible');
  });
});
