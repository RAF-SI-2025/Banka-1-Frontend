// cypress/e2e/kt4/otc-active-offers.cy.ts
// Celina 4 — OTC Aktivne ponude (Scenariji 1–7)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE'],
};

function aaplOffer(overrides: Partial<any> = {}) {
  return {
    id: 1,
    stockTicker: 'AAPL',
    buyerId: 77,
    sellerId: 88,
    amount: 50,
    pricePerStock: 150.0,
    premium: 400,
    settlementDate: '2027-12-31',
    status: 'PENDING_BUYER',
    modifiedBy: '88',
    interbank: false,
    counterpartyBankName: null,
    ...overrides,
  };
}

function msftOffer(overrides: Partial<any> = {}) {
  return {
    id: 2,
    stockTicker: 'MSFT',
    buyerId: 77,
    sellerId: 99,
    amount: 100,
    pricePerStock: 320.0,
    premium: 800,
    settlementDate: '2027-06-15',
    status: 'PENDING_SELLER',
    modifiedBy: '77',
    interbank: false,
    counterpartyBankName: null,
    ...overrides,
  };
}

function priceFeedForAAPL(currentPrice: number) {
  return [
    { ticker: 'AAPL', currentPrice, openPrice: currentPrice, previousClose: currentPrice, changePercent: 0, currency: 'USD', timestamp: new Date().toISOString() },
  ];
}

function interceptAllOtcApis(offers: object[], prices: object[] = []) {
  cy.intercept('GET', /\/otc\/public-stocks/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/offers\/active/, { statusCode: 200, body: offers }).as('getOffers');
  cy.intercept('GET', /\/otc\/contracts\/my/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/api\/interbank\/otc/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/stocks\/price-feed/, { statusCode: 200, body: prices });
}

function visitOtc(token: string) {
  cy.visit('/otc', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', token);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

// ─── Scenario 1 ───

describe('Scenario 1: Prikaz aktivnih OTC ponuda', () => {

  it('Prikazuje tabelu sa kolonama: hartija, količina, cena, settlement date, premium', () => {
    interceptAllOtcApis([aaplOffer(), msftOffer()]);
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('Aktivni pregovori').should('be.visible');
    cy.get('table').within(() => {
      cy.contains('th', 'Akcija').should('be.visible');
      cy.contains('th', 'Količina').should('be.visible');
      cy.contains('th', 'Cena/akciji').should('be.visible');
      cy.contains('th', 'Settlement').should('be.visible');
      cy.contains('th', 'Premium').should('be.visible');
      cy.contains('th', 'Odstupanje').should('be.visible');
    });
    cy.contains('td', 'AAPL').should('be.visible');
    cy.contains('td', 'MSFT').should('be.visible');
  });
});

// ─── Scenario 2 — zelena (±5%) ───

describe('Scenario 2: Color coding – zelena za ±5%', () => {

  it('Cena unutar ±5% tržišne cene se prikazuje zelenom bojom', () => {
    interceptAllOtcApis([aaplOffer({ pricePerStock: 147.0 })], priceFeedForAAPL(150));
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('td', 'AAPL')
      .closest('tr')
      .find('.otc-deviation-low')
      .should('exist');
  });
});

// ─── Scenario 3 — žuta (±5% do ±20%) ───

describe('Scenario 3: Color coding – žuta za ±5% do ±20%', () => {

  it('Cena sa odstupanjem između 5% i 20% se prikazuje žutom bojom', () => {
    interceptAllOtcApis([aaplOffer({ pricePerStock: 130.0 })], priceFeedForAAPL(150));
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('td', 'AAPL')
      .closest('tr')
      .find('.otc-deviation-mid')
      .should('exist');
  });
});

// ─── Scenario 4 — crvena (>±20%) ───

describe('Scenario 4: Color coding – crvena za >±20%', () => {

  it('Cena >20% odstupanja se prikazuje crvenom bojom', () => {
    interceptAllOtcApis([aaplOffer({ pricePerStock: 110.0 })], priceFeedForAAPL(150));
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('td', 'AAPL')
      .closest('tr')
      .find('.otc-deviation-high')
      .should('exist');
  });
});

// ─── Scenario 5 — Slanje kontraponude ───

describe('Scenario 5: Slanje kontraponude', () => {

  it('Korisnik klikne Protivponuda, unese novu cenu i premium, pošalje kontraponudu', () => {
    interceptAllOtcApis([aaplOffer({ status: 'PENDING_BUYER', buyerId: 77, sellerId: 88, modifiedBy: '88' })]);
    cy.intercept('POST', /\/otc\/offers\/\d+\/counter/, { statusCode: 200, body: {} }).as('postCounterOffer');
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('button', 'Protivponuda').click();
    });

    cy.get('#counterAmount').clear().type('30');
    cy.get('#counterPrice').clear().type('155.00');
    cy.get('#counterPremium').clear().type('350');
    cy.get('#counterDate').type('2028-01-15');
    cy.contains('button', 'Pošalji protivponudu').click();

    cy.wait('@postCounterOffer');
  });
});

// ─── Scenario 6 — Prihvatanje ponude ───

describe('Scenario 6: Prihvatanje ponude', () => {

  it('Korisnik klikne Prihvati ponudu, dobija success odgovor', () => {
    interceptAllOtcApis([aaplOffer({ status: 'PENDING_BUYER', buyerId: 77, sellerId: 88, modifiedBy: '88' })]);
    cy.intercept('POST', /\/otc\/offers\/\d+\/accept/, {
      statusCode: 200,
      body: { message: 'Ponuda prihvaćena' },
    }).as('acceptOffer');
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('button', 'Prihvati').click();
    });

    cy.wait('@acceptOffer');
  });
});

// ─── Scenario 7 — Odustajanje od ponude ───

describe('Scenario 7: Odustajanje od ponude', () => {

  it('Korisnik klikne Povuci na aktivnoj ponudi, dobija success odgovor', () => {
    interceptAllOtcApis([aaplOffer({ status: 'PENDING_SELLER', buyerId: 77, sellerId: 88, modifiedBy: '88' })]);
    cy.intercept('POST', /\/otc\/offers\/\d+\/withdraw/, {
      statusCode: 200,
      body: {},
    }).as('withdrawOffer');
    visitOtc(TOKEN_77);

    cy.contains('button', 'Aktivni pregovori').should('be.visible').click();
    cy.wait('@getOffers');

    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('button', 'Povuci').click();
    });

    cy.wait('@withdrawOffer');
  });
});
