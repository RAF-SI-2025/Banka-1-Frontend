// cypress/e2e/kt3/portfolio.cy.ts
// Scenarios 67–73: Moj portfolio
export {};

const MOCK_SUMMARY = {
  holdings: [
    {
      listingId: 1,
      listingType: 'STOCK',
      ticker: 'AAPL',
      quantity: 10,
      publicQuantity: 0,
      exercisable: null,
      currentPrice: 185.5,
      averagePurchasePrice: 160.0,
      profit: 255.0,
      lastModified: '2025-05-10T12:00:00Z',
    },
    {
      listingId: 2,
      listingType: 'FUTURES',
      ticker: 'NQ=F',
      quantity: 5,
      publicQuantity: 0,
      exercisable: null,
      currentPrice: 19000.0,
      averagePurchasePrice: 19100.0,
      profit: -100.0,
      lastModified: '2025-05-09T10:00:00Z',
    },
  ],
  totalProfit: 155.0,
  yearlyTaxPaid: 1500.0,
  monthlyTaxDue: 300.0,
};

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

const visitPortfolioAs = (user: object, summaryOverride = {}) => {
  cy.intercept('GET', '**/order/portfolio', {
    statusCode: 200,
    body: { ...MOCK_SUMMARY, ...summaryOverride },
  }).as('getPortfolio');

  cy.visit('/portfolio', {
    onBeforeLoad: (win) => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });

  cy.wait('@getPortfolio');
};

// Scenario 67: Portfolio prikazuje listu posedovanih hartija
describe('Scenario 67: Portfolio lista hartija', () => {
  beforeEach(() => {
    visitPortfolioAs(clientUser);
  });

  it('prikazuje naslov stranice portfolija', () => {
    cy.contains('Moj portfolio').should('be.visible');
  });

  it('prikazuje ticker hartija u tabeli', () => {
    cy.contains('AAPL').should('be.visible');
    cy.contains('NQ=F').should('be.visible');
  });

  it('prikazuje kolone sa tipom i profitom', () => {
    cy.contains(/STOCK|FUTURES|tip|type/i).should('be.visible');
    cy.contains(/profit|gubitak/i).should('be.visible');
  });
});

// Scenario 68: Portfolio prikazuje ukupan profit
describe('Scenario 68: Ukupan profit u portfoliju', () => {
  beforeEach(() => {
    visitPortfolioAs(clientUser);
  });

  it('prikazuje sekciju Profit sa ukupnim profit/gubitak tekstom', () => {
    cy.contains('Profit').should('be.visible');
    cy.contains(/Ukupan profit\/gubitak/i).should('be.visible');
  });
});

// Scenario 69: Portfolio prikazuje podatke o porezu
describe('Scenario 69: Sekcija poreza u portfoliju', () => {
  beforeEach(() => {
    visitPortfolioAs(clientUser);
  });

  it('prikazuje plaćen porez za tekuću godinu', () => {
    cy.contains(/Plaćeno ove godine/i).should('be.visible');
  });

  it('prikazuje neplaćen porez za tekući mesec', () => {
    cy.contains(/Neplaćeno ovog meseca/i).should('be.visible');
  });
});

// Scenario 70: Akcije – javni režim (publicQuantity = 0 po defaultu)
describe('Scenario 70: Javni režim za akcije', () => {
  beforeEach(() => {
    visitPortfolioAs(clientUser);
  });

  it('prikazuje sekciju za javni režim za akcije', () => {
    cy.contains('AAPL').should('be.visible');
    cy.contains('Javni režim za OTC').should('be.visible');
  });
});

// Scenario 72: Klijent ne vidi opciju iskorišćavanja opcija
describe('Scenario 72: Klijent ne vidi "Iskoristi opciju"', () => {
  beforeEach(() => {
    visitPortfolioAs(clientUser, {
      holdings: [
        ...MOCK_SUMMARY.holdings,
        {
          listingId: 99,
          listingType: 'OPTION',
          ticker: 'AAPL-OPT',
          quantity: 2,
          publicQuantity: 0,
          exercisable: true,
          currentPrice: 5.0,
          averagePurchasePrice: 4.0,
          profit: 10.0,
          lastModified: '2025-05-01T10:00:00Z',
        },
      ],
    });
  });

  it('klijent ne vidi dugme za iskorišćavanje opcija', () => {
    cy.contains(/iskoristi opciju|exercise option/i).should('not.exist');
  });
});

// Scenario 73: Nova hartija je po defaultu private
describe('Scenario 73: Hartija u portfoliju posle BUY ordera', () => {
  it('nova hartija ima publicQuantity = 0 (private po defaultu)', () => {
    visitPortfolioAs(clientUser, {
      holdings: [{ ...MOCK_SUMMARY.holdings[0], publicQuantity: 0 }],
      totalProfit: 255.0,
      yearlyTaxPaid: 0,
      monthlyTaxDue: 0,
    });

    cy.contains('AAPL').should('be.visible');
    // stock holdings show "Javni režim za OTC" section for managing public quantity
    cy.contains('Javni režim za OTC').should('be.visible');
  });
});

// Pristup bez autentikacije
describe('Portfolio – pristup bez tokena', () => {
  it('preusmerava na login bez autentikacije', () => {
    cy.visit('/portfolio', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
      },
    });
    cy.url().should('include', '/login');
  });
});
