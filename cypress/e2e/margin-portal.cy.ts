// cypress/e2e/margin-portal.cy.ts
// PR_18 C18.4: E2E testovi za marzni portal (PR_03 C3.8 + PR_14 C14.4 server-side wiring).
//
// Pokriveni flow-ovi:
//   - Stranica ucita marzni racun + transakcionu istoriju
//   - Add to margin: validacija (iznos > 0) + submit
//   - Withdraw: validacija + disabled kad je racun blokiran
//   - Server-side error mapping (insufficient funds -> error message)

describe('Marzni racun portal (PR_18)', () => {

  // JWT mock sa userId=77; localStorage key je 'access_token' jer je tako u
  // MarginAccountPortalComponent.getCurrentUserId().
  const mockJwt = (() => {
    const header = btoa('{"alg":"HS256","typ":"JWT"}');
    const payload = btoa('{"id":77,"sub":"77","exp":9999999999}');
    return `${header}.${payload}.signature`;
  })();

  beforeEach(() => {
    cy.clearLocalStorage();
    window.localStorage.setItem('access_token', mockJwt);
    window.localStorage.setItem('jwtToken', mockJwt);
    window.localStorage.setItem('userId', '77');
    window.localStorage.setItem('role', 'ClientTrading');

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
    cy.visit('/margin');
    cy.wait(['@getAccount', '@getTransactions']);

    cy.contains('5550001000000000077').should('be.visible');
    cy.contains('50,000.00').should('be.visible');
    cy.contains('Aktivan').should('be.visible');
  });

  it('Add to margin: salje POST /transactions/addToMargin/77', () => {
    cy.intercept('POST', '**/transactions/addToMargin/77', { statusCode: 200, body: {} }).as('add');
    cy.visit('/margin');
    cy.wait(['@getAccount', '@getTransactions']);

    cy.get('[data-testid=margin-add-amount]').type('10000');
    cy.get('[data-testid=margin-add-submit]').click();

    cy.wait('@add').its('request.body').should('deep.include', { amount: 10000 });
    // Posle submit-a, page reload-uje racun.
    cy.wait('@getAccount');
  });

  it('Add to margin: dugme disabled kad je iznos prazan ili 0', () => {
    cy.visit('/margin');
    cy.wait(['@getAccount', '@getTransactions']);

    cy.get('[data-testid=margin-add-submit]').should('be.disabled');
    cy.get('[data-testid=margin-add-amount]').type('0');
    cy.get('[data-testid=margin-add-submit]').should('be.disabled');
  });

  it('Withdraw: salje POST /transactions/withdrawFromMargin/77', () => {
    cy.intercept('POST', '**/transactions/withdrawFromMargin/77', { statusCode: 200, body: {} }).as('withdraw');
    cy.visit('/margin');
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
    cy.visit('/margin');
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
        initialMargin: 20000,           // ispod maintenance
        loanValue: 50000,
        maintenanceMargin: 25000,
        bankParticipation: 0.30,
        active: false,
      },
    }).as('getBlockedAccount');

    cy.visit('/margin');
    cy.wait(['@getBlockedAccount', '@getTransactions']);

    cy.get('[data-testid=margin-blocked-warning]').should('be.visible');
    cy.get('[data-testid=margin-withdraw-amount]').type('1000');
    cy.get('[data-testid=margin-withdraw-submit]').should('be.disabled');
  });
});
