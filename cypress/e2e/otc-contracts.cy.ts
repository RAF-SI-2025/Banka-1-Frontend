// cypress/e2e/otc-contracts.cy.ts
// PR_18 C18.5: E2E testovi za OTC contracts tab unutar OTC portala.
// OtcContractsComponent se renderuje kao tab u OtcPortalComponent (/otc),
// a ne kao posebna ruta — testovi posecuju /otc i klikaju "Izvrseni ugovori" tab.

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const OTC_CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE'],
};

const MOCK_CONTRACTS = [
  {
    id: 100, offerId: 200, stockTicker: 'AAPL',
    buyerId: 77, sellerId: 88, amount: 50,
    pricePerStock: 150.00, settlementDate: '2026-12-31',
    status: 'ACTIVE', createdAt: '2025-10-01T10:00:00',
  },
  {
    id: 101, offerId: 201, stockTicker: 'MSFT',
    buyerId: 88, sellerId: 77, amount: 30,
    pricePerStock: 250.00, settlementDate: '2026-11-30',
    status: 'ACTIVE', createdAt: '2025-10-15T10:00:00',
  },
];

const MOCK_PRICES = [
  { ticker: 'AAPL', currentPrice: 165.00, currency: 'USD',
    openPrice: 160, previousClose: 158, changePercent: 4.43,
    timestamp: '2025-12-01T10:00:00Z' },
  { ticker: 'MSFT', currentPrice: 240.00, currency: 'USD',
    openPrice: 250, previousClose: 252, changePercent: -4.76,
    timestamp: '2025-12-01T10:00:00Z' },
];

function visitOtc() {
  cy.visit('/otc', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(OTC_CLIENT_USER));
    },
  });
}

function openContractsTab() {
  cy.contains('button', 'Izvršeni ugovori').click();
}

describe('OTC sklopljeni ugovori (PR_18)', () => {

  beforeEach(() => {
    // Notification monitor calls (OtcNotificationMonitorService fires on page load)
    cy.intercept('GET', '**/api/interbank/otc/negotiations', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: [] });

    // Default tab (Dostupne akcije) calls — empty to avoid unhandled network errors
    cy.intercept('GET', '**/otc/public-stocks', { statusCode: 200, body: [] });

    // Contracts tab
    cy.intercept('GET', '**/otc/contracts/my?status=ACTIVE', {
      statusCode: 200,
      body: MOCK_CONTRACTS,
    }).as('myContracts');

    cy.intercept('GET', '**/stocks/price-feed/current*', {
      statusCode: 200,
      body: MOCK_PRICES,
    }).as('prices');
  });

  it('Ucita aktivne ugovore i prikazuje counterparty role', () => {
    visitOtc();
    openContractsTab();
    cy.wait('@myContracts');

    cy.get('[data-testid=otc-contracts-table]').should('be.visible');
    cy.contains('AAPL').should('be.visible');
    cy.contains('MSFT').should('be.visible');

    // Za AAPL ja sam buyer (77) -> counterparty je seller (88)
    cy.contains('#88').should('exist');
    cy.contains('Prodavac').should('exist');

    // Za MSFT ja sam seller (77) -> counterparty je buyer (88)
    cy.contains('Kupac').should('exist');
  });

  it('Filter status menja query param', () => {
    cy.intercept('GET', '**/otc/contracts/my?status=EXERCISED', {
      statusCode: 200, body: [],
    }).as('exercised');
    cy.intercept('GET', '**/otc/contracts/my?status=EXPIRED', {
      statusCode: 200, body: [],
    }).as('expired');

    visitOtc();
    openContractsTab();
    cy.wait('@myContracts');

    cy.get('[data-testid=status-filter]').select('EXERCISED');
    cy.wait('@exercised');
    cy.contains('Nema ugovora za izabrani filter').should('be.visible');

    cy.get('[data-testid=status-filter]').select('EXPIRED');
    cy.wait('@expired');
  });

  it('Live profit kolona se popunjava iz price-feed-a', () => {
    visitOtc();
    openContractsTab();
    cy.wait(['@myContracts', '@prices']);

    // AAPL: ja sam buyer, market 165 - strike 150 = +15 × 50 = +750.00
    cy.contains('750.00').should('be.visible');

    // MSFT: ja sam seller, market 240 - strike 250 = -10 × 30, sign-flip -> +300.00
    cy.contains('300.00').should('be.visible');
  });

  it('Iskoristi dugme zove POST /otc/contracts/{id}/exercise', () => {
    cy.intercept('POST', '**/otc/contracts/100/exercise', { statusCode: 202, body: {} }).as('exercise');
    visitOtc();
    openContractsTab();
    cy.wait('@myContracts');

    cy.window().then(win => cy.stub(win, 'confirm').returns(true));
    cy.window().then(win => cy.stub(win, 'alert'));

    cy.get('[data-testid=exercise-btn]').first().click();
    cy.wait('@exercise');
  });
});
