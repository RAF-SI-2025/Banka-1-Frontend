/**
 * PR_12 C12.14: OTC pun pregovor flow (Celina 4).
 *   - kupac kreira ponudu
 *   - vidi je u Aktivne ponude
 *   - vidi sklopljene ugovore
 */

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE'],
};

const MOCK_OFFER = {
  id: 1, stockTicker: 'AAPL', buyerId: 77, sellerId: 2, amount: 10,
  pricePerStock: 150, premium: 400, settlementDate: '2027-12-31',
  status: 'PENDING_SELLER', modifiedBy: '77', interbank: false, counterpartyBankName: null,
};

function stubOtcApis(offers: object[] = []) {
  cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: offers });
  cy.intercept('GET', '**/api/interbank/otc/negotiations', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/otc/contracts/my**', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/otc/public-stocks', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/stocks/price-feed**', { statusCode: 200, body: [] });
}

function visitAs(url: string) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

describe('PR_12: OTC pun pregovor flow', () => {
  beforeEach(() => {
    stubOtcApis();
  });

  it('kupac kreira inicijalnu OTC ponudu', () => {
    cy.intercept('POST', '**/otc/offers', { statusCode: 201, body: MOCK_OFFER }).as('createOffer');

    visitAs('/otc/create');
    cy.get('input[formcontrolname=stockTicker]').type('AAPL');
    cy.get('input[formcontrolname=sellerId]').type('2');
    cy.get('input[formcontrolname=amount]').type('10');
    cy.get('input[formcontrolname=pricePerStock]').type('150');
    cy.get('input[formcontrolname=premium]').type('400');
    cy.get('input[formcontrolname=settlementDate]').type('2027-12-31');
    cy.contains('button', 'Posalji ponudu').click();
    cy.wait('@createOffer');
    cy.url({ timeout: 10000 }).should('include', '/otc');
  });

  it('aktivne ponude prikazuju kreiranu ponudu', () => {
    cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: [MOCK_OFFER] }).as('getOffers');
    cy.intercept('GET', '**/api/interbank/otc/negotiations', { statusCode: 200, body: [] });

    visitAs('/otc/offers');
    cy.wait('@getOffers');
    cy.contains('AAPL').should('be.visible');
  });

  it('Sklopljeni ugovori stranica se otvara sa filter-om', () => {
    visitAs('/otc/contracts');
    cy.contains(/Sklopljeni|opcioni/i).should('be.visible');
    cy.get('select').should('exist');
  });
});
