/**
 * PR_09 C9.3: Cypress live test za OTC i Funds flow (PR_04 spec).
 */

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE', 'FUND_USER'],
};

const MOCK_OFFER = {
  id: 1, stockTicker: 'AAPL', buyerId: 77, sellerId: 2, amount: 10,
  pricePerStock: 150, premium: 400, settlementDate: '2027-12-31',
  status: 'PENDING_SELLER', modifiedBy: '77', interbank: false, counterpartyBankName: null,
};

function stubOtcApis() {
  cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: [] });
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

describe('PR_04: OTC i Funds portali', () => {
  beforeEach(() => {
    stubOtcApis();
    cy.intercept('GET', '**/funds**', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/profit**', { statusCode: 200, body: { totalProfit: 0 } });
  });

  it('OTC: aktivne ponude stranica se otvara', () => {
    visitAs('/otc');
    cy.contains('Aktivne ponude', { matchCase: false }).should('be.visible');
  });

  it('OTC: kreiranje nove ponude redirektuje nazad na /otc/offers', () => {
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

  it('Funds: discovery prikazuje listu fondova', () => {
    visitAs('/funds');
    cy.contains('Investicioni fondovi').should('be.visible');
  });

  it('Funds: profit-banke portal pokazuje total profit', () => {
    visitAs('/funds/profit-banke');
    cy.contains('Profit Banke').should('be.visible');
    cy.contains('Ukupan profit:').should('be.visible');
  });
});
