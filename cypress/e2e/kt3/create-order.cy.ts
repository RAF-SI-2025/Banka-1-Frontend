// cypress/e2e/kt3/create-order.cy.ts
// Scenarios 24, 26, 29–31, 33, 36–37, 43, 45: Kreiranje naloga
export {};

const MOCK_SECURITY = {
  id: 42,
  ticker: 'AAPL',
  name: 'Apple Inc.',
  type: 'STOCK',
  exchange: 'NASDAQ',
  currency: 'USD',
  price: 185.5,
  ask: 185.6,
  bid: 185.4,
  contractSize: 1,
  settlementDate: null,
};

const MOCK_ACCOUNTS = [
  { id: 101, accountNumber: '111-0001', currency: 'USD', balance: 50000, availableBalance: 50000 },
  { id: 102, accountNumber: '111-0002', currency: 'RSD', balance: 500000, availableBalance: 500000 },
];

const MOCK_DRAFT_ORDER = {
  id: 999,
  ticker: 'AAPL',
  orderType: 'MARKET',
  direction: 'BUY',
  quantity: 5,
  pricePerUnit: 185.5,
  approximatePrice: 927.5,
  fee: 7.0,
  allOrNone: false,
  margin: false,
  exchangeClosed: false,
  afterHours: false,
};

const clientUser = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['SECURITIES_TRADE_LIMITED'],
};

const setupInterceptsAndVisit = (direction = 'BUY', securityOverride = {}) => {
  cy.intercept('GET', '**/stock/api/listings/42*', {
    statusCode: 200,
    body: { ...MOCK_SECURITY, ...securityOverride },
  }).as('getSecurity');

  cy.intercept('GET', '**/stock/api/stock-exchanges*', {
    statusCode: 200,
    body: [],
  }).as('getExchanges');

  cy.intercept('GET', '**/accounts/client/accounts*', {
    statusCode: 200,
    body: {
      content: MOCK_ACCOUNTS.map(a => ({
        id: a.id,
        brojRacuna: a.accountNumber,
        currency: a.currency,
        stanjeRacuna: a.balance,
        raspolozivoStanje: a.availableBalance,
        status: 'ACTIVE',
      })),
      totalElements: 2,
    },
  }).as('getAccounts');

  cy.visit(`/orders/create/${direction}/42`, {
    onBeforeLoad: (win) => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify(clientUser));
    },
  });

  cy.wait('@getSecurity');
};

// Helpers — inputs have no name/formcontrolname, identified by label text or position
const quantityInput = () => cy.contains('label', 'Količina').siblings('input').first();
const limitInput = () => cy.contains('label', 'Limit vrednost').siblings('input').first();
const stopInput = () => cy.contains('label', 'Stop vrednost').siblings('input').first();

// Scenario 24: Kreiranje ordera sa nevalidnom količinom
describe('Scenario 24: Nevalidna količina ordera', () => {
  beforeEach(() => {
    setupInterceptsAndVisit();
  });

  it('količina 0 – dugme za nastavak je onemogućeno', () => {
    quantityInput().clear().type('0');
    cy.contains('button', 'Nastavi na potvrdu').should('be.disabled');
  });
});

// Scenario 26: Market BUY order – samo količina
describe('Scenario 26: Market BUY order kreiranje', () => {
  beforeEach(() => {
    setupInterceptsAndVisit();
  });

  it('forma prikazuje polja za količinu, limit i stop', () => {
    quantityInput().should('exist');
    limitInput().should('exist');
    stopInput().should('exist');
  });

  it('pri praznim limit/stop poljima tip ordera je MARKET', () => {
    cy.contains('Order Type').siblings('strong').should('contain', 'MARKET');
  });
});

// Scenario 29: Limit BUY order
describe('Scenario 29: Limit BUY order', () => {
  beforeEach(() => {
    setupInterceptsAndVisit();
  });

  it('unos limit vrednosti menja tip ordera u LIMIT', () => {
    quantityInput().clear().type('5');
    limitInput().clear().type('180');
    cy.contains('Order Type').siblings('strong').should('contain', 'LIMIT');
  });
});

// Scenario 30: Stop BUY order
describe('Scenario 30: Stop BUY order', () => {
  beforeEach(() => {
    setupInterceptsAndVisit();
  });

  it('unos stop vrednosti (bez limita) menja tip ordera u STOP', () => {
    quantityInput().clear().type('5');
    stopInput().clear().type('190');
    cy.contains('Order Type').siblings('strong').should('contain', 'STOP');
  });
});

// Scenario 31: Stop-Limit BUY order
describe('Scenario 31: Stop-Limit BUY order', () => {
  beforeEach(() => {
    setupInterceptsAndVisit();
  });

  it('unos i stop i limit vrednosti daje STOP_LIMIT order', () => {
    quantityInput().clear().type('5');
    stopInput().clear().type('190');
    limitInput().clear().type('195');
    cy.contains('Order Type').siblings('strong').should('contain', 'STOP_LIMIT');
  });
});

// Scenario 33: Dijalog potvrde prikazuje sve informacije
describe('Scenario 33: Dijalog potvrde', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/orders/buy*', {
      statusCode: 200,
      body: MOCK_DRAFT_ORDER,
    }).as('draftOrder');

    setupInterceptsAndVisit();
    cy.wait('@getAccounts');
  });

  it('dijalog potvrde sadrži tip ordera, količinu i ukupnu cenu', () => {
    quantityInput().clear().type('5');
    cy.get('select#create-order-account').select(1);
    cy.contains('button', 'Nastavi na potvrdu').click();
    cy.wait('@draftOrder');

    cy.contains('Potvrda ordera').should('be.visible');
    cy.contains('Tip ordera:').should('be.visible');
    cy.contains('Količina:').should('be.visible');
    cy.contains('Ukupno:').should('be.visible');
    cy.contains('button', 'Potvrdi order').should('be.visible');
  });
});

// Scenario 36: SELL order – prikazuje max količinu
describe('Scenario 36: SELL order forma', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/order/portfolio*', {
      statusCode: 200,
      body: {
        holdings: [{ listingId: 42, ticker: 'AAPL', quantity: 10, publicAmount: 0 }],
      },
    }).as('getPortfolio');

    setupInterceptsAndVisit('SELL');
    cy.wait('@getPortfolio');
  });

  it('forma za prodaju prikazuje maksimalnu količinu za prodaju', () => {
    cy.contains('Maks. dostupno za prodaju').should('be.visible');
  });
});

// Scenario 37: Korisnik ne može prodati više nego što poseduje
describe('Scenario 37: Prodaja više od posedovanog', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/order/portfolio*', {
      statusCode: 200,
      body: {
        holdings: [{ listingId: 42, ticker: 'AAPL', quantity: 10, publicAmount: 0 }],
      },
    }).as('getPortfolio');

    setupInterceptsAndVisit('SELL');
    cy.wait('@getPortfolio');
  });

  it('unos količine veće od posedovane prikazuje grešku', () => {
    quantityInput().clear().type('15');
    cy.contains('Ne možete prodati više nego što posedujete').should('be.visible');
  });

  it('dugme za nastavak je onemogućeno kad je količina prekoračena', () => {
    quantityInput().clear().type('15');
    cy.contains('button', 'Nastavi na potvrdu').should('be.disabled');
  });
});

// Scenario 45: Upozorenje kada je berza zatvorena (u dijalogu potvrde)
describe('Scenario 45: Berza zatvorena upozorenje', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/orders/buy*', {
      statusCode: 200,
      body: { ...MOCK_DRAFT_ORDER, exchangeClosed: true },
    }).as('draftOrder');

    setupInterceptsAndVisit();
    cy.wait('@getAccounts');
  });

  it('prikazuje upozorenje o zatvorenoj berzi u dijalogu potvrde', () => {
    quantityInput().clear().type('5');
    cy.get('select#create-order-account').select(1);
    cy.contains('button', 'Nastavi na potvrdu').click();
    cy.wait('@draftOrder');

    cy.contains('Berza je trenutno zatvorena').should('be.visible');
  });
});
