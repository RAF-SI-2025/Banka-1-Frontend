// cypress/e2e/fund-detail.cy.ts
// E2E testovi za detaljan prikaz investicionog fonda.

describe('Fund Detail Component', () => {
  const fundDetail = {
    id: 101,
    name: 'Alpha Growth Fund',
    description: 'Fond fokusiran na IT sektor.',
    managerName: 'Marko Matic',
    fundValue: 2600000,
    minimumContribution: 1000,
    profit: 500000,
    accountNumber: '123-45678-90',
    liquidity: 1500000,
    securities: [
      {
        id: 1,
        ticker: 'AAPL',
        price: 174.5,
        change: 2.5,
        volume: 50000000,
        initialMarginCost: 15000,
        acquisitionDate: '2024-03-15',
      },
      {
        id: 2,
        ticker: 'MSFT',
        price: 380.5,
        change: -1.2,
        volume: 25000000,
        initialMarginCost: 30000,
        acquisitionDate: '2024-04-02',
      },
    ],
    performance: {
      monthly: [
        { date: '2026-01-31', value: 2140000, profit: 240000 },
        { date: '2026-02-28', value: 2210000, profit: 300000 },
        { date: '2026-03-31', value: 2360000, profit: 380000 },
      ],
      quarterly: [
        { date: '2025-09-30', value: 1980000, profit: 190000 },
        { date: '2025-12-31', value: 2140000, profit: 240000 },
      ],
      yearly: [
        { date: '2024-12-31', value: 1810000, profit: 160000 },
        { date: '2025-12-31', value: 2140000, profit: 240000 },
      ],
    },
  };

  const quarterlyPerformance = [
    { date: '2025-09-30', value: 1980000, profit: 190000 },
    { date: '2025-12-31', value: 2140000, profit: 240000 },
  ];

  const visitFundDetailAs = (user: {
    email: string;
    role: string;
    permissions: string[];
  }) => {
    cy.intercept('GET', '**/stock/investment-funds/101', {
      statusCode: 200,
      body: fundDetail,
    }).as('getFundDetail');

    cy.visit('/securities/funds/101', {
      onBeforeLoad: (win) => {
        const browserWindow = win as Window;
        browserWindow.localStorage.clear();
        browserWindow.localStorage.setItem('authToken', 'fake-jwt-token');
        browserWindow.localStorage.setItem('loggedUser', JSON.stringify(user));
      },
    });

    cy.wait('@getFundDetail');
  };

  it('preusmerava neulogovanog korisnika na login', () => {
    cy.visit('/securities/funds/101', {
      onBeforeLoad: (win) => {
        (win as Window).localStorage.clear();
      },
    });

    cy.url().should('include', '/login');
  });

  it('prikazuje osnovne podatke fonda i listu hartija klijentu', () => {
    visitFundDetailAs({
      email: 'client@test.com',
      role: 'CLIENT',
      permissions: ['BANKING_BASIC'],
    });

    cy.contains('Detaljan prikaz fonda').should('be.visible');
    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('Fond fokusiran na IT sektor.').should('be.visible');
    cy.contains('Menadžer: Marko Matic').should('be.visible');
    cy.contains('2.600.000,00 RSD').should('be.visible');
    cy.contains('1.000,00 RSD').should('be.visible');
    cy.contains('500.000,00 RSD').should('be.visible');
    cy.contains('123-45678-90').should('be.visible');
    cy.contains('1.500.000,00 RSD').should('be.visible');

    cy.contains('Hartije fonda').should('be.visible');
    cy.contains('th', 'Ticker').should('be.visible');
    cy.contains('th', 'Price').should('be.visible');
    cy.contains('th', 'Change').should('be.visible');
    cy.contains('th', 'Volume').should('be.visible');
    cy.contains('th', 'initialMarginCost').should('be.visible');
    cy.contains('th', 'acquisitionDate').should('be.visible');
    cy.contains('td', 'AAPL').should('be.visible');
    cy.contains('td', 'MSFT').should('be.visible');
    cy.contains('button', 'Prodaj').should('not.exist');
  });

  it('prikazuje dugme za prodaju hartija supervizoru', () => {
    visitFundDetailAs({
      email: 'supervisor@test.com',
      role: 'Supervisor',
      permissions: ['FUND_AGENT_MANAGE'],
    });

    cy.contains('th', 'Akcije').should('be.visible');
    cy.contains('button', 'Prodaj').should('be.visible');
  });

  it('učitava drugi period performansi kada korisnik izabere kvartalni prikaz', () => {
    cy.intercept('GET', '**/stock/investment-funds/101/performance?period=quarterly', {
      statusCode: 200,
      body: quarterlyPerformance,
    }).as('getQuarterlyPerformance');

    visitFundDetailAs({
      email: 'client@test.com',
      role: 'CLIENT',
      permissions: ['BANKING_BASIC'],
    });

    cy.contains('Performanse fonda').should('be.visible');
    cy.get('canvas').should('be.visible');

    cy.contains('button', 'Kvartalno').click();
    cy.wait('@getQuarterlyPerformance');

    cy.contains('td', /30\. ?09\. ?2025\./).should('be.visible');
    cy.contains('td', '1.980.000,00 RSD').should('be.visible');
    cy.contains('td', '190.000,00 RSD').should('be.visible');
  });

  it('šalje zahtev za prodaju hartije iz fonda za supervizora', () => {
    cy.intercept('POST', '**/stock/investment-funds/101/securities/1/sell', {
      statusCode: 200,
      body: {},
    }).as('sellFundSecurity');

    visitFundDetailAs({
      email: 'supervisor@test.com',
      role: 'Supervisor',
      permissions: ['FUND_AGENT_MANAGE'],
    });

    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('button', 'Prodaj').click();
    });

    cy.wait('@sellFundSecurity');
    cy.contains('Zahtev za prodaju hartije je poslat.').should('be.visible');
  });
});

export {};
