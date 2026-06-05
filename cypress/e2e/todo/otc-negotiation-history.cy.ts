// cypress/e2e/todo/otc-negotiation-history.cy.ts
// TODO — OTC Istorija pregovora (Scenariji 5–8)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE'],
};

const HISTORY = [
  {
    id: 1,
    offer: { stockTicker: 'AAPL', amount: 50, pricePerStock: 150.0, premium: 400, status: 'ACCEPTED', settlementDate: '2027-12-31', lastModified: '2026-05-20T15:30:00' },
    counterpartyName: 'Klijent #88',
    createdAt: '2026-05-15T10:00:00',
    history: [
      { timestamp: '2026-05-15T10:00:00', changedBy: 'Klijent #77', oldPrice: null, newPrice: 150.0, oldQuantity: null, newQuantity: 50 },
      { timestamp: '2026-05-18T14:00:00', changedBy: 'Klijent #88', oldPrice: 150.0, newPrice: 160.0, oldQuantity: 50, newQuantity: 40 },
      { timestamp: '2026-05-20T15:30:00', changedBy: 'Klijent #77', oldPrice: 160.0, newPrice: 150.0, oldQuantity: 40, newQuantity: 50 },
    ],
    expanded: false,
  },
  {
    id: 2,
    offer: { stockTicker: 'MSFT', amount: 100, pricePerStock: 310.0, premium: 800, status: 'REJECTED', settlementDate: '2027-06-15', lastModified: '2026-04-10T11:00:00' },
    counterpartyName: 'Klijent #99',
    createdAt: '2026-04-05T09:00:00',
    history: [{ timestamp: '2026-04-05T09:00:00', changedBy: 'Klijent #77', oldPrice: null, newPrice: 310.0, oldQuantity: null, newQuantity: 100 }],
    expanded: false,
  },
];

function interceptAllOtcApis(history: object[]) {
  cy.intercept('GET', /\/otc\/public-stocks/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/offers\/active/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/contracts\/my/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/api\/interbank\/otc/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/stocks\/price-feed/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/offers\/history/, { statusCode: 200, body: history }).as('getHistory');
}

function visitOtc() {
  cy.visit('/otc', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

// ─── Scenario 5: Prikaz istorije pregovora ───

describe('Scenario 5: Prikaz istorije pregovora', () => {

  it('Tabela sa akcijom, količinom, statusom i drugom stranom', () => {
    interceptAllOtcApis(HISTORY);
    visitOtc();

    cy.contains('button', 'Istorija pregovora').should('be.visible').click();
    cy.wait('@getHistory');

    cy.contains('AAPL').should('be.visible');
    cy.contains('MSFT').should('be.visible');
    cy.contains('ACCEPTED').should('be.visible');
    cy.contains('REJECTED').should('be.visible');
  });
});

// ─── Scenario 6: Filter – prihvaćeni ───

describe('Scenario 6: Filtriranje – prihvaćeni', () => {

  it('Filter "Prihvaćeno" prikazuje samo prihvaćene', () => {
    interceptAllOtcApis(HISTORY);
    visitOtc();

    cy.contains('button', 'Istorija pregovora').should('be.visible').click();
    cy.wait('@getHistory');

    cy.contains('label', 'Status').siblings('select').select('ACCEPTED');
    cy.contains('button', 'Primeni filtere').click();
    cy.wait('@getHistory');

    cy.contains('AAPL').should('be.visible');
    cy.contains('MSFT').should('not.exist');
  });
});

// ─── Scenario 7: Filter – odbijeni ───

describe('Scenario 7: Filtriranje – odbijeni', () => {

  it('Filter "Odbijeno" prikazuje samo odbijene', () => {
    interceptAllOtcApis(HISTORY);
    visitOtc();

    cy.contains('button', 'Istorija pregovora').should('be.visible').click();
    cy.wait('@getHistory');

    cy.contains('label', 'Status').siblings('select').select('REJECTED');
    cy.contains('button', 'Primeni filtere').click();
    cy.wait('@getHistory');

    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('not.exist');
  });
});

// ─── Scenario 8: Detaljna istorija kontraponuda ───

describe('Scenario 8: Istorija kontraponuda za pregovor', () => {

  it('Lista kontraponuda sa starim i novim vrednostima', () => {
    interceptAllOtcApis(HISTORY);
    visitOtc();

    cy.contains('button', 'Istorija pregovora').should('be.visible').click();
    cy.wait('@getHistory');

    cy.contains('tr', 'AAPL').click();

    cy.contains('Istorija kontraponuda').should('be.visible');
    cy.contains('Cena (Stara').should('be.visible');
    cy.contains('Količina (Stara').should('be.visible');
    cy.contains('Klijent #88').should('be.visible');
  });
});
