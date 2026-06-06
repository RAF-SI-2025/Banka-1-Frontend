// cypress/e2e/margin-portal.cy.ts
// PR_18 C18.4: E2E testovi za marzni portal (PR_03 C3.8 + PR_14 C14.4 server-side wiring).

describe('Marzni racun portal (PR_18)', () => {

  // JWT mock sa userId=77; auth guard cita 'authToken', MarginAccountPortalComponent
  // cita 'access_token' za getCurrentUserId() — oba kljuca se postavljaju u onBeforeLoad.
  const mockJwt = (() => {
    const header = btoa('{"alg":"HS256","typ":"JWT"}');
    const payload = btoa('{"id":77,"sub":"77","exp":9999999999}');
    return `${header}.${payload}.signature`;
  })();

  function visitMargin() {
    cy.visit('/margin', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', mockJwt);
        win.localStorage.setItem('access_token', mockJwt);
        win.localStorage.setItem('userId', '77');
        win.localStorage.setItem('role', 'ClientTrading');
        win.localStorage.setItem('loggedUser', JSON.stringify({
          email: 'client@banka.com',
          role: 'Client',
          permissions: []
        }));
      }
    });
  }

  beforeEach(() => {
    cy.intercept('GET', '**/accounts/getMarginUser/77', {
      statusCode: 200,
      body: {
        accountNumber: '5550001000000000077',
        userId: 77,
        initialMargin: 50000,
        loanValue: 0,
        maintenanceMargin: 25000,
        bankParticipation: 0.30,
        active: true,
      },
    }).as('getAccount');

    cy.intercept('GET', '**/transactions/getAllMarginTransactions/5550001000000000077', {
      statusCode: 200,
      body: [
        { id: 1, accountNumber: '5550001000000000077', amount: 50000,
          transactionType: 'ADD_TO_MARGIN', occurredAt: '2025-01-01T10:00:00',
          description: 'Initial deposit' },
      ],
    }).as('getTransactions');
  });

  it('Ucita marzni racun i pokaze stanje', () => {
    visitMargin();
    cy.wait(['@getAccount', '@getTransactions']);

    cy.contains('5550001000000000077').should('be.visible');
    cy.contains('50,000.00').should('be.visible');
    cy.contains('Aktivan').should('be.visible');
  });

  it('Add to margin: salje POST /transactions/addToMargin/77', () => {
    cy.intercept('POST', '**/transactions/addToMargin/77', { statusCode: 200, body: {} }).as('add');
    visitMargin();
    cy.wait(['@getAccount', '@getTransactions']);

    cy.get('[data-testid=margin-add-amount]').type('10000');
    cy.get('[data-testid=margin-add-submit]').click();

    cy.wait('@add').its('request.body').should('deep.include', { amount: 10000 });
    cy.wait('@getAccount');
  });

  it('Add to margin: dugme disabled kad je iznos prazan ili 0', () => {
    visitMargin();
    cy.wait(['@getAccount', '@getTransactions']);

    cy.get('[data-testid=margin-add-submit]').should('be.disabled');
    cy.get('[data-testid=margin-add-amount]').type('0');
    cy.get('[data-testid=margin-add-submit]').should('be.disabled');
  });

  it('Withdraw: salje POST /transactions/withdrawFromMargin/77', () => {
    cy.intercept('POST', '**/transactions/withdrawFromMargin/77', { statusCode: 200, body: {} }).as('withdraw');
    visitMargin();
    cy.wait(['@getAccount', '@getTransactions']);

    cy.get('[data-testid=margin-withdraw-amount]').type('5000');
    cy.get('[data-testid=margin-withdraw-submit]').click();

    cy.wait('@withdraw').its('request.body').should('deep.include', { amount: 5000 });
  });

  it('Withdraw: server-side error mapira na error UI', () => {
    cy.intercept('POST', '**/transactions/withdrawFromMargin/77', {
      statusCode: 400,
      body: { message: 'Isplata bi spustila initialMargin ispod maintenanceMargin' },
    }).as('withdrawFail');
    visitMargin();
    cy.wait(['@getAccount', '@getTransactions']);

    cy.get('[data-testid=margin-withdraw-amount]').type('99999');
    cy.get('[data-testid=margin-withdraw-submit]').click();
    cy.wait('@withdrawFail');

    cy.contains('maintenanceMargin').should('be.visible');
  });

  it('Withdraw dugme disabled kad je racun blokiran', () => {
    cy.intercept('GET', '**/accounts/getMarginUser/77', {
      statusCode: 200,
      body: {
        accountNumber: '5550001000000000077',
        userId: 77,
        initialMargin: 20000,
        loanValue: 50000,
        maintenanceMargin: 25000,
        bankParticipation: 0.30,
        active: false,
      },
    }).as('getBlockedAccount');

    visitMargin();
    cy.wait(['@getBlockedAccount', '@getTransactions']);

    cy.get('[data-testid=margin-blocked-warning]').should('be.visible');
    cy.get('[data-testid=margin-withdraw-amount]').type('1000');
    cy.get('[data-testid=margin-withdraw-submit]').should('be.disabled');
  });
});
