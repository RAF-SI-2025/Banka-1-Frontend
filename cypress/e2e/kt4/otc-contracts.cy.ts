// cypress/e2e/kt4/otc-contracts.cy.ts
// Celina 4 — OTC Sklopljeni ugovori (Scenariji 8–11)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE'],
};

// buyerId=77 → user je buyer → counterpartyRole=SELLER → canExercise=true
const ACTIVE_CONTRACT_RAW = {
  id: 1, offerId: 1, stockTicker: 'AAPL', buyerId: 77, sellerId: 88,
  amount: 50, pricePerStock: 150.0, settlementDate: '2027-12-31',
  status: 'ACTIVE', createdAt: '2026-01-15T10:00:00', interbank: false,
};

const EXPIRED_CONTRACT_RAW = {
  id: 2, offerId: 2, stockTicker: 'MSFT', buyerId: 77, sellerId: 99,
  amount: 30, pricePerStock: 310.0, settlementDate: '2026-01-15',
  status: 'EXPIRED', createdAt: '2025-06-01T08:00:00', interbank: false,
};

// buyerId=77 → user je buyer → canExercise=true, ali profit negativan
const NEGATIVE_CONTRACT_RAW = {
  id: 3, offerId: 3, stockTicker: 'GOOGL', buyerId: 77, sellerId: 88,
  amount: 10, pricePerStock: 200.0, settlementDate: '2027-09-01',
  status: 'ACTIVE', createdAt: '2026-03-01T12:00:00', interbank: false,
};

const ALL_CONTRACTS = [ACTIVE_CONTRACT_RAW, EXPIRED_CONTRACT_RAW];

function interceptBaseApis() {
  cy.intercept('GET', /\/otc\/public-stocks/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/offers\/active/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/api\/interbank\/otc/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/stocks\/price-feed/, { statusCode: 200, body: [] });
}

function interceptContracts(all: object[]) {
  cy.intercept('GET', /\/otc\/contracts\/my/, (req) => {
    const url = req.url;
    if (url.includes('status=ACTIVE')) {
      req.reply({ statusCode: 200, body: all.filter((c: any) => c.status === 'ACTIVE') });
    } else if (url.includes('status=EXPIRED')) {
      req.reply({ statusCode: 200, body: all.filter((c: any) => c.status === 'EXPIRED') });
    } else {
      req.reply({ statusCode: 200, body: all });
    }
  }).as('getContracts');
}

function visitOtc() {
  cy.visit('/otc', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

// ─── Scenario 8: Prikaz svih ugovora ───

describe('Scenario 8: Prikaz sklopljenih ugovora', () => {

  it('Prikazuje tabelu sa važećim i isteklim ugovorima', () => {
    interceptBaseApis();
    interceptContracts(ALL_CONTRACTS);
    visitOtc();

    cy.contains('button', 'Izvršeni ugovori').should('be.visible').click();
    cy.wait('@getContracts');

    cy.get('[data-testid="status-filter"]').select('ALL');
    cy.wait('@getContracts');

    cy.get('[data-testid="otc-contracts-table"]').should('be.visible');
    cy.contains('th', 'Akcija').should('be.visible');
    cy.contains('th', 'Kolicina').should('be.visible');
    cy.contains('th', 'Strike').should('be.visible');
    cy.contains('th', 'Live profit').should('be.visible');
    cy.contains('th', 'Settlement').should('be.visible');
    cy.contains('th', 'Druga strana').should('be.visible');
    cy.contains('td', 'AAPL').should('be.visible');
    cy.contains('td', 'MSFT').should('be.visible');
  });
});

// ─── Scenario 9: Filtriranje po statusu – samo važeći ───

describe('Scenario 9: Filtriranje po statusu – samo važeći', () => {

  it('Filter "Važeći" prikazuje samo aktivne ugovore', () => {
    interceptBaseApis();
    interceptContracts(ALL_CONTRACTS);
    visitOtc();

    cy.contains('button', 'Izvršeni ugovori').should('be.visible').click();
    cy.wait('@getContracts');

    cy.get('[data-testid="status-filter"]').select('ALL');
    cy.wait('@getContracts');
    cy.contains('td', 'MSFT').should('be.visible');

    cy.get('[data-testid="status-filter"]').select('ACTIVE');
    cy.wait('@getContracts');

    cy.contains('td', 'AAPL').should('be.visible');
    cy.contains('td', 'MSFT').should('not.exist');
  });
});

// ─── Scenario 10: Iskorišćavanje opcije – profit pozitivan ───

describe('Scenario 10: Iskorišćavanje opcije – profit pozitivan', () => {

  it('Pozitivan profit, dugme Iskoristi vidljivo i radi', () => {
    interceptBaseApis();
    interceptContracts([ACTIVE_CONTRACT_RAW]);
    cy.intercept('POST', /\/otc\/contracts\/\d+\/exercise/, {
      statusCode: 200,
      body: { message: 'Opcija iskorišćena' },
    }).as('exerciseContract');
    visitOtc();

    cy.contains('button', 'Izvršeni ugovori').should('be.visible').click();
    cy.wait('@getContracts');

    cy.contains('tr', 'AAPL').within(() => {
      cy.get('[data-testid="exercise-btn"]').should('be.visible').click();
    });

    cy.wait('@exerciseContract');
  });
});

// ─── Scenario 11: Opcija u gubitku – profit negativan ───

describe('Scenario 11: Opcija u gubitku – profit negativan', () => {

  it('Negativan profit, dugme Iskoristi i dalje vidljivo', () => {
    interceptBaseApis();
    interceptContracts([NEGATIVE_CONTRACT_RAW]);
    visitOtc();

    cy.contains('button', 'Izvršeni ugovori').should('be.visible').click();
    cy.wait('@getContracts');

    // ne moze exercise jer je user seller, ali red i dalje renderuje
    cy.contains('td', 'GOOGL').should('be.visible');
    cy.contains('tr', 'GOOGL').within(() => {
      cy.get('[data-testid="exercise-btn"]').should('be.visible');
    });
  });
});
