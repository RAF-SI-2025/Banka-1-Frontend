// cypress/e2e/otc-contracts.cy.ts
// PR_18 C18.5: E2E testovi za OTC contracts stranicu
// (PR_14 C14.5 backend wire + PR_15 C15.8 live profit kolona).

describe('OTC sklopljeni ugovori (PR_18)', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    window.localStorage.setItem('jwtToken',
      'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock');
    window.localStorage.setItem('userId', '77');
    window.localStorage.setItem('role', 'ClientTrading');

    cy.intercept('GET', '**/otc/contracts/my?status=ACTIVE', {
      statusCode: 200,
      body: [
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
      ],
    }).as('myContracts');

    cy.intercept('GET', '**/stocks/price-feed/current*', {
      statusCode: 200,
      body: [
        { ticker: 'AAPL', currentPrice: 165.00, currency: 'USD',
          openPrice: 160, previousClose: 158, changePercent: 4.43,
          timestamp: '2025-12-01T10:00:00Z' },
        { ticker: 'MSFT', currentPrice: 240.00, currency: 'USD',
          openPrice: 250, previousClose: 252, changePercent: -4.76,
          timestamp: '2025-12-01T10:00:00Z' },
      ],
    }).as('prices');
  });

  it('Ucita aktivne ugovore i prikazuje counterparty role', () => {
    cy.visit('/otc/contracts');
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

    cy.visit('/otc/contracts');
    cy.wait('@myContracts');

    cy.get('[data-testid=status-filter]').select('EXERCISED');
    cy.wait('@exercised');
    cy.contains('Nema sklopljenih ugovora').should('be.visible');

    cy.get('[data-testid=status-filter]').select('EXPIRED');
    cy.wait('@expired');
  });

  it('Live profit kolona se popunjava iz price-feed-a', () => {
    cy.visit('/otc/contracts');
    cy.wait(['@myContracts', '@prices']);

    // AAPL: ja sam buyer, market 165 - strike 150 = +15 × 50 = +750.00
    // (positiv profit za buyer-a kada market > strike).
    cy.contains('750.00').should('be.visible');

    // MSFT: ja sam seller, market 240 - strike 250 = -10 × 30, sign-flip -> +300.00
    // (positiv za seller kada market < strike — buyer ne bi exercise-ovao).
    cy.contains('300.00').should('be.visible');
  });

  it('Iskoristi dugme zove POST /otc/contracts/{id}/exercise', () => {
    cy.intercept('POST', '**/otc/contracts/100/exercise', { statusCode: 202, body: {} }).as('exercise');
    cy.visit('/otc/contracts');
    cy.wait('@myContracts');

    // confirm() return true
    cy.window().then(win => cy.stub(win, 'confirm').returns(true));
    // alert() - just spy, otherwise the stub auto-triggers.
    cy.window().then(win => cy.stub(win, 'alert'));

    cy.get('[data-testid=exercise-btn]').first().click();
    cy.wait('@exercise');
  });
});
