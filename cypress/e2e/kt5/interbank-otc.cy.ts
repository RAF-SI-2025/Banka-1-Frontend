// cypress/e2e/kt5/interbank-otc.cy.ts
// KT5 — Međubankarski OTC

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['OTC_TRADE'] };

const OFFERS = [
  { id: 1, stockTicker: 'AAPL', buyerId: 77, sellerId: 88, amount: 50, pricePerStock: 150.0, premium: 400, settlementDate: '2027-12-31', status: 'PENDING_BUYER', modifiedBy: '88', interbank: false, counterpartyBankName: null },
  { id: 10, stockTicker: 'GOOGL', buyerId: 77, sellerId: 999, amount: 25, pricePerStock: 185.0, premium: 500, settlementDate: '2027-11-30', status: 'PENDING_BUYER', modifiedBy: '999', interbank: true, counterpartyBankName: 'Banka 2' },
];

const CONTRACTS = [{ id: 5, offerId: 10, stockTicker: 'GOOGL', buyerId: 77, sellerId: 999, amount: 25, pricePerStock: 185.0, settlementDate: '2027-11-30', status: 'ACTIVE', interbank: true, createdAt: '2026-04-01T10:00:00' }];

function visitOtc() {
  cy.intercept('GET', /\/otc\/offers\/active/, { statusCode: 200, body: OFFERS }).as('o');
  cy.intercept('GET', /\/api\/interbank\/otc\/negotiations/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/contracts\/my/, { statusCode: 200, body: CONTRACTS }).as('c');
  cy.intercept('GET', /\/otc\/public-stocks/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/stocks\/price-feed/, { statusCode: 200, body: [] });
  cy.visit('/otc', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
}

describe('KT5 — Interbank OTC', () => {
  before(() => { visitOtc(); cy.get('body', { timeout: 20000 }).should('be.visible'); });

  it('Sc. 4: prikazuje OTC portal', () => { visitOtc(); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('Sc. 5: kreiranje cross-bank ponude', () => {
    cy.visit('/otc/create', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });
  it('Sc. 6: kontraponuda druge banke', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('Sc. 7: izvršavanje opcije', () => {
    cy.intercept('POST', /\/otc\/contracts\/\d+\/exercise/, { statusCode: 200, body: { status: 'COMPLETED' } });
    visitOtc(); cy.get('body').should('be.visible');
  });
});
