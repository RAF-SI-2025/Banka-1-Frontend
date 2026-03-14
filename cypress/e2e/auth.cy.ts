// cypress/e2e/auth.cy.ts
// E2E testovi za Auth flow (login, logout, token management)
// Pokretanje: npx cypress open  ili  npx cypress run

describe('Auth E2E', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  // ─────────────────────────────────────────────
  // LOGIN — forma
  // ─────────────────────────────────────────────

  describe('Login forma', () => {

    beforeEach(() => {
      cy.visit('/login');
    });

    it('treba da prikaže email, password i login dugme', () => {
      cy.get('[data-cy=email]').should('exist');
      cy.get('[data-cy=password]').should('exist');
      cy.get('[data-cy=login-btn]').should('exist');
    });

    it('uspešno logovanje čuva token u localStorage', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock',
          refreshToken: 'refresh-mock',
          role: 'EmployeeAdmin',
          permissions: ['READ', 'WRITE']
        }
      }).as('loginRequest');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginRequest');

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken'))
          .to.equal('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock');
      });
    });

    it('uspešno logovanje čuva korisnika u localStorage', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock',
          refreshToken: 'refresh-mock',
          role: 'EmployeeAdmin',
          permissions: ['READ', 'WRITE']
        }
      }).as('loginRequest');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginRequest');

      cy.window().then(win => {
        const user = JSON.parse(win.localStorage.getItem('loggedUser') || '{}');
        expect(user.email).to.equal('user@test.com');
        expect(user.permissions).to.include('READ');
        expect(user.permissions).to.include('WRITE');
      });
    });

    it('neuspešno logovanje ne čuva token u localStorage', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { message: 'Neispravni kredencijali' }
      }).as('loginFail');

      cy.get('[data-cy=email]').type('wrong@test.com');
      cy.get('[data-cy=password]').type('wrongpass');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginFail');

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });

    it('neuspešno logovanje prikazuje error poruku', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { message: 'Neispravni kredencijali' }
      }).as('loginFail');

      cy.get('[data-cy=email]').type('wrong@test.com');
      cy.get('[data-cy=password]').type('wrongpass');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginFail');

      cy.get('.alert-error').should('be.visible');
    });

    it('login šalje email i password u request body', () => {
      cy.intercept('POST', '**/auth/login', req => {
        expect(req.body.email).to.equal('user@test.com');
        expect(req.body.password).to.equal('password123');
        req.reply({
          statusCode: 200,
          body: { jwt: 'tok', refreshToken: 'ref', role: 'EmployeeBasic', permissions: [] }
        });
      }).as('loginBody');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginBody');
    });

    it('uspešno logovanje preusmerava na /employees', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: { jwt: 'tok', refreshToken: 'ref', role: 'EmployeeAdmin', permissions: [] }
      }).as('loginRequest');

      // Intercept employees API that will be called after redirect
      cy.intercept('GET', '**/employees*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0 }
      });

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/employees');
    });

  });

  // ─────────────────────────────────────────────
  // INTERCEPTOR — Authorization header
  // ─────────────────────────────────────────────

  describe('AuthInterceptor — Authorization header', () => {

    it('ne dodaje Authorization header na /auth/login zahtev', () => {
      cy.visit('/login');

      cy.intercept('POST', '**/auth/login', req => {
        expect(req.headers['authorization']).to.be.undefined;
        req.reply({
          statusCode: 200,
          body: { jwt: 'new.token', refreshToken: 'ref', role: 'EmployeeBasic', permissions: [] }
        });
      }).as('loginNoHeader');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginNoHeader');
    });

  });

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  describe('Logout', () => {

    beforeEach(() => {
      // Set up authenticated state
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'some.token');
        win.localStorage.setItem('loggedUser', JSON.stringify({
          email: 'user@test.com', role: 'EmployeeAdmin', permissions: []
        }));
      });

      // Intercept the employees API call
      cy.intercept('GET', '**/employees*', {
        statusCode: 200,
        body: {
          content: [
            { id: 1, ime: 'Test', prezime: 'User', email: 'test@test.com', pozicija: 'Dev', departman: 'IT', aktivan: true, role: 'EmployeeBasic' }
          ],
          totalElements: 1,
          totalPages: 1
        }
      }).as('getEmployees');

      cy.visit('/employees');
      cy.wait('@getEmployees');
    });

    it('logout briše token iz localStorage', () => {
      cy.get('[data-cy=logout-btn]').click();

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
        expect(win.localStorage.getItem('loggedUser')).to.be.null;
      });
    });

    it('logout preusmerava na /login', () => {
      cy.get('[data-cy=logout-btn]').click();
      cy.url().should('include', '/login');
    });

  });

});
