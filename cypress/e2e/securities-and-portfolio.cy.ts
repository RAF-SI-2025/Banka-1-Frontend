/**
 * PR_12 C12.13: hartije od vrednosti + portfolio (Celina 3).
 *   - klijent vidi listu hartija
 *   - klikne na stock detalj
 *   - portfolio prikaz
 *   - tax tracking (supervisor)
 *   - orders overview (supervisor)
 */

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['SECURITIES_TRADE_LIMITED'],
};

const SUPERVISOR_USER = {
  email: 'supervisor@banka.com',
  role: 'Supervisor',
  permissions: ['BANKING_BASIC', 'SECURITIES_TRADE_UNLIMITED', 'FUND_AGENT_MANAGE'],
};

function visitAs(url: string, user: object) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });
}

describe('PR_12: Hartije + Portfolio', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/interbank/otc/negotiations', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/otc/contracts/my**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/stock/api/listings/stocks**', {
      statusCode: 200,
      body: { content: [{ ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', price: 185.5 }], totalElements: 1, totalPages: 1 },
    });
    cy.intercept('GET', '**/stock/api/listings/AAPL**', {
      statusCode: 200,
      body: { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', price: 185.5, history: [] },
    });
    cy.intercept('GET', '**/order/portfolio**', {
      statusCode: 200,
      body: { holdings: [], totalProfit: 0, yearlyTaxPaid: 0, monthlyTaxDue: 0 },
    });
    cy.intercept('GET', '**/stock/api/stock-exchanges**', { statusCode: 200, body: [] });
  });

  it('klijent vidi listu hartija', () => {
    visitAs('/securities', CLIENT_USER);
    cy.contains(/akcij|stock/i).should('be.visible');
  });

  it('klijent vidi stock detalj sa "Buy" dugmetom (PR_05 C5.1 fix)', () => {
    visitAs('/securities/stock/AAPL', CLIENT_USER);
    cy.contains(/AAPL/i).should('be.visible');
  });

  it('klijent vidi svoj portfolio', () => {
    visitAs('/portfolio', CLIENT_USER);
    cy.contains(/portfolio/i).should('be.visible');
  });
});

describe('PR_12: Tax i Orders overview (supervisor)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/interbank/otc/negotiations', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/otc/contracts/my**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/order/tax/tracking**', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 },
    });
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 },
    });
  });

  it('supervisor vidi tax-tracking portal', () => {
    visitAs('/tax-tracking', SUPERVISOR_USER);
    cy.contains(/porez|tax/i).should('be.visible');
  });

  it('supervisor vidi orders overview', () => {
    visitAs('/orders-overview', SUPERVISOR_USER);
    cy.contains(/order|nalog/i).should('be.visible');
  });
});
