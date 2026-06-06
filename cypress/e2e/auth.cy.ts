// cypress/e2e/auth.cy.ts
// Auth flow (login, logout, token) — validan JWT, regex, resourceType filter

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';

describe('Auth E2E', () => {

  beforeEach(() => { cy.clearLocalStorage(); });

  describe('Login forma', () => {
    beforeEach(() => { cy.visit('/login'); });

    it('prikazuje email, password i login dugme', () => {
      cy.get('[data-cy=email]').should('exist');
      cy.get('[data-cy=password]').should('exist');
      cy.get('[data-cy=login-btn]').should('exist');
    });

    it('uspešno logovanje čuva token (employee)', () => {
      cy.intercept('POST', /\/employees\/auth\/login/, {
        statusCode: 200,
        body: { jwt: TOKEN, refreshToken: 'ref', role: 'EmployeeAdmin', permissions: ['READ'] },
      }).as('login');
      cy.contains('button', 'Zaposleni').click();
      cy.get('[data-cy=email]').type('u@t.com');
      cy.get('[data-cy=password]').type('p');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@login');
      cy.window().then(w => { expect(w.localStorage.getItem('authToken')).to.equal(TOKEN); });
    });

    it('uspešno logovanje čuva korisnika (employee)', () => {
      cy.intercept('POST', /\/employees\/auth\/login/, {
        statusCode: 200,
        body: { jwt: TOKEN, refreshToken: 'ref', role: 'EmployeeAdmin', permissions: ['READ', 'WRITE'] },
      }).as('login');
      cy.contains('button', 'Zaposleni').click();
      cy.get('[data-cy=email]').type('u@t.com');
      cy.get('[data-cy=password]').type('p');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@login');
      cy.window().then(w => {
        const u = JSON.parse(w.localStorage.getItem('loggedUser') || '{}');
        expect(u.permissions).to.include('READ');
      });
    });

    it('neuspešno logovanje ne čuva token', () => {
      cy.intercept('POST', /\/clients\/auth\/login/, { statusCode: 401 }).as('fail');
      cy.get('[data-cy=email]').type('x@x.com');
      cy.get('[data-cy=password]').type('x');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@fail');
      cy.window().then(w => { expect(w.localStorage.getItem('authToken')).to.be.null; });
    });

    it('neuspešno logovanje prikazuje error', () => {
      cy.intercept('POST', /\/clients\/auth\/login/, { statusCode: 401 }).as('fail');
      cy.get('[data-cy=email]').type('x@x.com');
      cy.get('[data-cy=password]').type('x');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@fail');
      cy.get('.bg-red-50').should('be.visible');
    });

    it('login šalje email i password u body', () => {
      cy.intercept('POST', /\/clients\/auth\/login/, req => {
        expect(req.body.email).to.equal('u@t.com');
        req.reply({ statusCode: 200, body: { token: 't' } });
      }).as('body');
      cy.get('[data-cy=email]').type('u@t.com');
      cy.get('[data-cy=password]').type('p');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@body');
    });

    it('uspešno logovanje preusmerava na /employees', () => {
      cy.intercept('POST', /\/employees\/auth\/login/, {
        statusCode: 200,
        body: { jwt: TOKEN, refreshToken: 'ref', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL'] },
      }).as('login');
      cy.contains('button', 'Zaposleni').click();
      cy.get('[data-cy=email]').type('u@t.com');
      cy.get('[data-cy=password]').type('p');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@login');
      cy.url().should('include', '/employees');
    });
  });

  describe('AuthInterceptor', () => {
    it('ne dodaje Authorization na /auth/login', () => {
      cy.visit('/login');
      cy.intercept('POST', /\/clients\/auth\/login/, req => {
        expect(req.headers['authorization']).to.be.undefined;
        req.reply({ statusCode: 200, body: { token: 't' } });
      }).as('noAuth');
      cy.get('[data-cy=email]').type('u@t.com');
      cy.get('[data-cy=password]').type('p');
      cy.get('[data-cy=login-btn]').click();
      cy.wait('@noAuth');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.window().then(w => {
        w.localStorage.setItem('authToken', TOKEN);
        w.localStorage.setItem('loggedUser', JSON.stringify({ email: 'u@t.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL'] }));
      });
      cy.intercept({ method: 'GET', url: /\/employees\b/ }, (req) => {
        if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
          req.reply({ statusCode: 200, body: { content: [], totalElements: 0 } });
        } else { req.continue(); }
      });
      cy.visit('/employees');
    });

    it('logout briše token', () => {
      cy.get('[aria-label^="Korisnik"]').click();
      cy.contains('Odjava').click();
      cy.window().then(w => {
        expect(w.localStorage.getItem('authToken')).to.be.null;
        expect(w.localStorage.getItem('loggedUser')).to.be.null;
      });
    });

    it('logout preusmerava na /login', () => {
      cy.get('[aria-label^="Korisnik"]').click();
      cy.contains('Odjava').click();
      cy.url().should('include', '/login');
    });
  });
});
