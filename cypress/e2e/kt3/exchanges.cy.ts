// cypress/e2e/kt3/exchanges.cy.ts
// Scenario 82: Berze – prikaz liste i toggle za radno vreme
export {};

const MOCK_EXCHANGES = [
  {
    id: 1,
    exchangeName: 'New York Stock Exchange',
    exchangeAcronym: 'NYSE',
    exchangeMICCode: 'XNYS',
    polity: 'USA',
    currency: 'USD',
    timeZone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    isActive: true,
    preMarketOpenTime: null,
    preMarketCloseTime: null,
    postMarketOpenTime: null,
    postMarketCloseTime: null,
  },
  {
    id: 2,
    exchangeName: 'NASDAQ',
    exchangeAcronym: 'NASDAQ',
    exchangeMICCode: 'XNAS',
    polity: 'USA',
    currency: 'USD',
    timeZone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    isActive: false,
    preMarketOpenTime: null,
    preMarketCloseTime: null,
    postMarketOpenTime: null,
    postMarketCloseTime: null,
  },
  {
    id: 3,
    exchangeName: 'London Stock Exchange',
    exchangeAcronym: 'LSE',
    exchangeMICCode: 'XLON',
    polity: 'UK',
    currency: 'GBP',
    timeZone: 'Europe/London',
    openTime: '08:00',
    closeTime: '16:30',
    isActive: true,
    preMarketOpenTime: null,
    preMarketCloseTime: null,
    postMarketOpenTime: null,
    postMarketCloseTime: null,
  },
];

const supervisorUser = {
  email: 'supervisor@banka.com',
  role: 'Supervisor',
  permissions: ['BANKING_BASIC', 'SECURITIES_TRADE_UNLIMITED', 'FUND_AGENT_MANAGE'],
};

describe('Scenario 82: Lista berzi i toggle radnog vremena', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/stock/api/stock-exchanges*', {
      statusCode: 200,
      body: MOCK_EXCHANGES,
    }).as('getExchanges');

    cy.intercept('PUT', '**/stock/api/stock-exchanges/*/toggle-active*', {
      statusCode: 200,
      body: {},
    }).as('toggleExchange');

    cy.visit('/stock-exchange', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getExchanges');
  });

  it('prikazuje naslov Berze', () => {
    cy.contains('h1', 'Berze').should('be.visible');
  });

  it('prikazuje tabelu sa berzama', () => {
    cy.get('table').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('prikazuje sve obavezne kolone tabele', () => {
    cy.contains('th', 'Naziv berze').should('be.visible');
    cy.contains('th', 'Akronim').should('be.visible');
    cy.contains('th', 'MIC').should('be.visible');
    cy.contains('th', 'Valuta').should('be.visible');
    cy.contains('th', 'Vremenska zona').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
    cy.contains('th', /radno vreme/i).should('be.visible');
  });

  it('prikazuje nazive berzi iz mock podataka', () => {
    cy.contains('New York Stock Exchange').should('be.visible');
    cy.contains('NASDAQ').should('be.visible');
  });

  it('prikazuje status badge Otvorena/Zatvorena za svaku berzu', () => {
    cy.get('tbody tr').first().within(() => {
      cy.contains(/Otvorena|Zatvorena/).should('be.visible');
    });
  });

  it('toggle dugme postoji za svaku berzu', () => {
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).contains('button', /Ukljuceno|Iskljuceno/).should('exist');
    });
  });

  it('klik na toggle dugme poziva API', () => {
    cy.get('tbody tr').first().contains('button', /Ukljuceno|Iskljuceno/).click();
    cy.wait('@toggleExchange');
    cy.get('@toggleExchange').its('response.statusCode').should('eq', 200);
  });

  it('berze sa isActive=true prikazuju dugme Ukljuceno', () => {
    // MOCK_EXCHANGES[0] has isActive: true → button text "Ukljuceno"
    cy.get('tbody tr').first().contains('button', 'Ukljuceno').should('exist');
  });

  it('berze sa isActive=false prikazuju dugme Iskljuceno', () => {
    // MOCK_EXCHANGES[1] has isActive: false → button text "Iskljuceno"
    cy.get('tbody tr').eq(1).contains('button', 'Iskljuceno').should('exist');
  });
});
