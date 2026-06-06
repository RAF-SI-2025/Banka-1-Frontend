/**
 * PR_12 C12.10: zaposleni mgmt flow (Celina 1).
 *   - admin login → /employees lista
 *   - kreiranje novog zaposlenog
 *   - edit → izmena pozicije
 *   - deaktivacija
 */

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const ADMIN_USER = {
  email: 'admin@banka.rs',
  role: 'ADMIN',
  permissions: ['EMPLOYEE_MANAGE_ALL', 'CLIENT_MANAGE'],
};

function visitAs(url: string) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(ADMIN_USER));
    },
  });
}

describe('PR_12: Zaposleni management', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/employees**', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 },
    });
    cy.intercept('GET', '**/clients/customers**', {
      statusCode: 200,
      body: {
        content: [{ id: 1, ime: 'Marko', prezime: 'Markovic', email: 'marko@test.com' }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      },
    });
    cy.intercept('POST', '**/employees**', {
      statusCode: 201,
      body: { id: 99, ime: 'Test', prezime: 'Zaposleni', email: 'test@test.com' },
    });
  });

  it('admin vidi listu zaposlenih', () => {
    visitAs('/employees');
    cy.contains('Zaposleni').should('be.visible');
  });

  it('admin kreira novog zaposlenog', () => {
    visitAs('/employees/new');
    cy.get('input[name=ime]').type('Test');
    cy.get('input[name=prezime]').type('Zaposleni');
    cy.get('input[name=email]').type(`zap-${Date.now()}@test.com`);
    cy.get('input[name=username]').type(`testzap${Date.now()}`);
    cy.get('input[name=pozicija]').type('Programer');
    cy.get('input[name=departman]').type('IT');
    cy.get('button[type=submit]').click();
    cy.contains('uspeh', { matchCase: false, timeout: 10000 }).should('be.visible');
  });

  it('admin pristupa /clients listi i vidi seed klijente', () => {
    visitAs('/clients');
    cy.contains('Marko').should('be.visible');
  });
});
