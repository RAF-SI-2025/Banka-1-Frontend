// cypress/e2e/auth.cy.ts
// E2E testovi za AuthService i AuthInterceptor
// Pokretanje: npx cypress open  ili  npx cypress run

describe('Auth E2E', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  // ─────────────────────────────────────────────
  // LOGIN — forma
  // ─────────────────────────────────────────────

  describe('Login forma', () => {

    it('treba da prikaže email, password i login dugme', () => {
      cy.get('[data-cy=email]').should('exist');
      cy.get('[data-cy=password]').should('exist');
      cy.get('[data-cy=login-btn]').should('exist');
    });

    it('uspešno logovanje čuva token u localStorage', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock',
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
          token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock',
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

    it('login šalje email i password u request body', () => {
      cy.intercept('POST', '**/auth/login', req => {
        expect(req.body.email).to.equal('user@test.com');
        expect(req.body.password).to.equal('password123');
        req.reply({ statusCode: 200, body: { token: 'tok', permissions: [] } });
      }).as('loginBody');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginBody');
    });

  });

  // ─────────────────────────────────────────────
  // INTERCEPTOR — Authorization header
  // ─────────────────────────────────────────────

  describe('AuthInterceptor — Authorization header', () => {

    it('ne dodaje Authorization header na /auth/login zahtev', () => {
      cy.intercept('POST', '**/auth/login', req => {
        expect(req.headers['authorization']).to.be.undefined;
        req.reply({
          statusCode: 200,
          body: { token: 'new.token', permissions: [] }
        });
      }).as('loginNoHeader');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginNoHeader');
    });

  });


  it('logout briše token iz localStorage', () => {
    cy.window().then(win => {
      win.localStorage.setItem('authToken', 'some.token');
      win.localStorage.setItem('loggedUser', JSON.stringify({
        email: 'user@test.com', permissions: []
      }));
    });

    cy.get('[data-cy=logout-btn]').click();

    cy.window().then(win => {
      expect(win.localStorage.getItem('authToken')).to.be.null;
      expect(win.localStorage.getItem('loggedUser')).to.be.null;
    });
  });

  it('logout preusmerava na /login', () => {
    cy.window().then(win => {
      win.localStorage.setItem('authToken', 'some.token');
    });

    cy.get('[data-cy=logout-btn]').click();
    cy.url().should('include', '/login');
  });

});
