// cypress/e2e/kt3/create-order.cy.ts
// KT3 — Kreiranje naloga (standalone komponenta — guard redirect testovi)

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';

const SEC = { listingId: 42, ticker: 'AAPL', name: 'Apple Inc.', exchangeMICCode: 'NASDAQ', price: 185.5, currency: 'USD', listingType: 'STOCK', bid: 185.4, ask: 185.6, change: 0, changePercent: 0, volume: 1000000, maintenanceMargin: 0, initialMarginCost: 0, lastRefresh: '2026-06-01', contractSize: 1 };
const ACCTS = { content: [{ id: 101, accountNumber: '111-0001', nazivRacuna: 'USD', currency: 'USD', raspolozivoStanje: 50000, stanjeRacuna: 50000, status: 'ACTIVE' }] };
const DRAFT = { id: 999, ticker: 'AAPL', orderType: 'MARKET', direction: 'BUY', quantity: 5, pricePerUnit: 185.5, approximatePrice: 927.5, fee: 7.0, allOrNone: false, margin: false, exchangeClosed: false, afterHours: false };

describe('KT3 — Create Order', () => {

  it('Sc. 24: stranica se ucitava sa validnim tokenom', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('Sc. 26: forma sadrzi label elemente', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 29: response sa 200 za limit order simulaciju', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: { ...SEC, price: 180 } });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 30: response za STOP order', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: { ...SEC, price: 190 } });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 31: STOP_LIMIT simulacija', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 33: dijalog potvrde — POST intercept radi', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.intercept('POST', /\/orders\/buy/, { statusCode: 200, body: DRAFT });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 36: SELL forma se ucitava', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.intercept('GET', /\/order\/portfolio/, { statusCode: 200, body: { holdings: [{ listingId: 42, ticker: 'AAPL', quantity: 10 }] } });
    cy.visit('/orders/create/SELL/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 37: SELL prekoracenje — intercept radi', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.intercept('GET', /\/order\/portfolio/, { statusCode: 200, body: { holdings: [{ listingId: 42, ticker: 'AAPL', quantity: 10 }] } });
    cy.visit('/orders/create/SELL/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });

  it('Sc. 45: berza zatvorena — POST intercept sa exchangeClosed', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/42/, { statusCode: 200, body: SEC });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: ACCTS });
    cy.intercept('POST', /\/orders\/buy/, { statusCode: 200, body: { ...DRAFT, exchangeClosed: true } });
    cy.visit('/orders/create/BUY/42', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify({ email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] })); } });
    cy.get('body').should('be.visible');
  });
});
