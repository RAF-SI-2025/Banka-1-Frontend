/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsClientApi(email?: string, password?: string): Chainable<string>;
      loginAsEmployeeApi(email?: string, password?: string): Chainable<string>;
      seedClientSession(email?: string, password?: string): Chainable<void>;
      seedEmployeeSession(email?: string, password?: string): Chainable<void>;
      visitAsClient(url: string, email?: string, password?: string): Chainable<void>;
      visitAsEmployee(url: string, email?: string, password?: string): Chainable<void>;
    }
  }
}

const apiUrl = () => Cypress.env('apiUrl') || 'http://localhost';

Cypress.Commands.add('loginAsClientApi', (email?: string, password?: string) => {
  const e = email || Cypress.env('clientEmail');
  const p = password || Cypress.env('clientPassword');
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl()}/clients/auth/login`,
      body: { email: e, password: p },
    })
    .then((res) => {
      expect(res.status).to.eq(200);
      const token = res.body.token;
      expect(token, 'client JWT token').to.be.a('string').and.not.empty;
      return cy.wrap(token, { log: false });
    });
});

Cypress.Commands.add('loginAsEmployeeApi', (email?: string, password?: string) => {
  const e = email || Cypress.env('employeeEmail');
  const p = password || Cypress.env('employeePassword');
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl()}/employees/auth/login`,
      body: { email: e, password: p },
    })
    .then((res) => {
      expect(res.status).to.eq(200);
      const token = res.body.jwt || res.body.token;
      expect(token, 'employee JWT token').to.be.a('string').and.not.empty;
      return cy.wrap(token, { log: false });
    });
});

Cypress.Commands.add('seedClientSession', (email?: string, password?: string) => {
  const e = email || Cypress.env('clientEmail');
  cy.loginAsClientApi(e, password).then((token) => {
    let role = 'CLIENT';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.roles ?? 'CLIENT';
    } catch {}
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', token);
      win.localStorage.setItem(
        'loggedUser',
        JSON.stringify({ email: e, role, permissions: ['BANKING_BASIC'] }),
      );
    });
  });
});

Cypress.Commands.add('seedEmployeeSession', (email?: string, password?: string) => {
  const e = email || Cypress.env('employeeEmail');
  cy.loginAsEmployeeApi(e, password).then((token) => {
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', token);
      win.localStorage.setItem(
        'loggedUser',
        JSON.stringify({
          email: e,
          role: 'EmployeeAdmin',
          permissions: ['EMPLOYEE_MANAGE_ALL', 'CLIENT_MANAGE'],
        }),
      );
    });
  });
});

// Module-level cache - svaki put login bi udario rate limiter (HTTP 429 na
// /clients/auth/login i /employees/auth/login posle 10-15 zahteva). Spec ima
// 40+ scenarija; jedan login po roli za ceo run je dovoljan.
let cachedClientToken: string | null = null;
let cachedEmployeeToken: string | null = null;

Cypress.Commands.add('visitAsClient', (url: string, email?: string, password?: string) => {
  const e = email || Cypress.env('clientEmail');
  const useCached = !email && !password && cachedClientToken;
  const tokenChain = useCached
    ? cy.wrap(cachedClientToken!, { log: false })
    : cy.loginAsClientApi(e, password).then((t) => {
        if (!email && !password) cachedClientToken = t;
        return t;
      });
  tokenChain.then((token) => {
    let role = 'CLIENT';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.roles ?? 'CLIENT';
    } catch {}
    const userJson = JSON.stringify({ email: e, role, permissions: ['BANKING_BASIC'] });
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem('authToken', token);
        win.localStorage.setItem('loggedUser', userJson);
      },
    });
  });
});

Cypress.Commands.add('visitAsEmployee', (url: string, email?: string, password?: string) => {
  const e = email || Cypress.env('employeeEmail');
  const useCached = !email && !password && cachedEmployeeToken;
  const tokenChain = useCached
    ? cy.wrap(cachedEmployeeToken!, { log: false })
    : cy.loginAsEmployeeApi(e, password).then((t) => {
        if (!email && !password) cachedEmployeeToken = t;
        return t;
      });
  tokenChain.then((token) => {
    const userJson = JSON.stringify({
      email: e,
      role: 'EmployeeAdmin',
      permissions: ['EMPLOYEE_MANAGE_ALL', 'CLIENT_MANAGE'],
    });
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem('authToken', token);
        win.localStorage.setItem('loggedUser', userJson);
      },
    });
  });
});

export {};