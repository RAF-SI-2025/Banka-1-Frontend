// cypress/e2e/kt3/securities-search.cy.ts
// Scenario 10-18: Hartije od vrednosti – Prikaz i pretraga
export {};

const MOCK_STOCKS = [
  { id: 1, ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', price: 185.5, volume: 1000000, change: 1.2, changePercent: 0.65 },
  { id: 2, ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', price: 420.0, volume: 900000, change: -0.5, changePercent: -0.12 },
];

const MOCK_FOREX = [
  { id: 10, ticker: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'FOREX', price: 1.08, volume: 5000000, change: 0.01, bid: 1.079, ask: 1.081, spread: 0.002 },
];

const clientUser = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['SECURITIES_TRADE_LIMITED'],
};

const actuaryUser = {
  email: 'agent@banka.com',
  role: 'Agent',
  permissions: ['SECURITIES_TRADE_UNLIMITED'],
};

const loginAs = (user: object) => {
  cy.intercept('GET', '**/stock/api/stock-exchanges*', { statusCode: 200, body: [] }).as('getExchanges');
  cy.visit('/securities', {
    onBeforeLoad: (win: any) => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });
};

// Scenario 10: Klijent vidi samo akcije i Fjučerse, ne vidi Forex
describe('Scenario 10: Klijent vidi samo akcije i futures ugovore', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/stock/api/listings/stocks*', {
      statusCode: 200,
      body: { content: MOCK_STOCKS, totalElements: 2, totalPages: 1 },
    }).as('getStocks');
    loginAs(clientUser);
    cy.wait('@getStocks');
  });

  it('klijent vidi tab Akcije', () => {
    cy.contains('button.z-tab', 'Akcije').should('be.visible');
  });

  it('klijent vidi tab Fjučersi', () => {
    cy.contains('button.z-tab', 'Fjučersi').should('be.visible');
  });

  it('klijent ne vidi tab Forex parovi', () => {
    cy.contains('button.z-tab', 'Forex parovi').should('not.exist');
  });
});

// Scenario 11: Aktuar vidi sve tipove hartija
describe('Scenario 11: Aktuar vidi sve tipove hartija', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/stock/api/listings/stocks*', {
      statusCode: 200,
      body: { content: MOCK_STOCKS, totalElements: 2, totalPages: 1 },
    }).as('getStocks');
    cy.intercept('GET', '**/stock/api/listings/forex*', {
      statusCode: 200,
      body: { content: MOCK_FOREX, totalElements: 1, totalPages: 1 },
    }).as('getForex');
    loginAs(actuaryUser);
    cy.wait('@getStocks');
  });

  it('aktuar vidi tabove za Akcije, Fjučersi i Forex parovi', () => {
    cy.contains('button.z-tab', 'Akcije').should('be.visible');
    cy.contains('button.z-tab', 'Fjučersi').should('be.visible');
    cy.contains('button.z-tab', 'Forex parovi').should('be.visible');
  });
});

// Scenario 12: Pretraga hartije po ticker-u
describe('Scenario 12: Pretraga hartije po ticker-u', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/stock/api/listings/stocks*', (req) => {
      const url = req.url;
      if (url.includes('ticker=MSFT') || url.includes('search=MSFT') || url.includes('query=MSFT')) {
        req.reply({ statusCode: 200, body: { content: [MOCK_STOCKS[1]], totalElements: 1, totalPages: 1 } });
      } else {
        req.reply({ statusCode: 200, body: { content: MOCK_STOCKS, totalElements: 2, totalPages: 1 } });
      }
    }).as('searchStocks');
    loginAs(actuaryUser);
    cy.wait('@searchStocks');
  });

  it('unos ticker-a MSFT filtrira listu', () => {
    cy.get('input[placeholder*="tikeru"]').clear().type('MSFT');
    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('not.exist');
  });
});

// Scenario 13: Pretraga bez rezultata
describe('Scenario 13: Pretraga hartije bez rezultata', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/stock/api/listings/stocks*', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 },
    }).as('emptySearch');
    loginAs(actuaryUser);
    cy.wait('@emptySearch');
  });

  it('prazna lista prikazuje poruku o praznom stanju', () => {
    cy.contains(/Nema hartija|nema rezultata|no results/i).should('be.visible');
  });
});

// Scenario 15: Nevalidan opseg cene (filter panel)
describe('Scenario 15: Filter panel sa opsegom cene', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/stock/api/listings/stocks*', {
      statusCode: 200,
      body: { content: MOCK_STOCKS, totalElements: 2, totalPages: 1 },
    }).as('getStocks');
    loginAs(actuaryUser);
    cy.wait('@getStocks');
  });

  it('filter panel otvara se klikom na Filteri dugme', () => {
    cy.contains('button', 'Filteri').click();
    cy.contains('label', 'Cena od').should('be.visible');
    cy.contains('label', 'Cena do').should('be.visible');
  });

  it('filter panel sadrži polja za opseg cene', () => {
    cy.contains('button', 'Filteri').click();
    cy.contains('label', 'Cena od').parent().find('input[type=number]').should('exist');
    cy.contains('label', 'Cena do').parent().find('input[type=number]').should('exist');
  });
});

// Scenario 18: Otvaranje detalja hartije
describe('Scenario 18: Detaljan prikaz hartije', () => {
  it('direktna poseta stock detalj stranici prikazuje ticker', () => {
    cy.intercept('GET', '**/stock/api/listings/AAPL*', {
      statusCode: 200,
      body: { ...MOCK_STOCKS[0], history: [] },
    }).as('getStockDetail');
    cy.intercept('GET', '**/stock/api/stock-exchanges*', { statusCode: 200, body: [] }).as('getExchanges');

    cy.visit('/securities/stock/AAPL', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(actuaryUser));
      },
    });
    cy.contains(/AAPL/i).should('be.visible');
  });
});
