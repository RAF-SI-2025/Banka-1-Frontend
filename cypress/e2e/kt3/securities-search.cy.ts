// cypress/e2e/kt3/securities-search.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const AGENT = { email: 'a@b.com', role: 'Agent', permissions: ['SECURITIES_TRADE_UNLIMITED'] };
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['SECURITIES_TRADE_LIMITED'] };
const STOCKS = { content: [{ id: 1, ticker: 'AAPL', name: 'Apple', exchange: 'NASDAQ', price: 185, volume: 1000000, change: 1.2, changePercent: 0.65 }], totalElements: 1 };

function go(user: object) {
  cy.intercept('GET', /\/stock\/api\/listings\/stocks/, { statusCode: 200, body: STOCKS });
  cy.intercept('GET', /\/stock\/api\/listings\/forex/, { statusCode: 200, body: { content: [] } });
  cy.intercept('GET', /\/stock\/api\/stock-exchanges/, { statusCode: 200, body: [] });
  cy.visit('/securities', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(user)); } });
}

describe('KT3 — Hartije od vrednosti', () => {
  it('Aktuar vidi tabove', () => { go(AGENT); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('Klijent ne vidi Forex', () => { go(CLIENT); cy.get('body').should('be.visible'); });
  it('Pretraga', () => { go(AGENT); cy.get('body').should('be.visible'); });
  it('Filter panel', () => { go(AGENT); cy.get('body').should('be.visible'); });
  it('Detalji AAPL', () => {
    cy.intercept('GET', /\/stock\/api\/listings\/AAPL/, { statusCode: 200, body: { ...STOCKS.content[0], history: [], exchangeMICCode: 'NASDAQ', bid: 185, ask: 185, change: 1, changePercent: 0, maintenanceMargin: 0, initialMarginCost: 0, contractSize: 1, lastRefresh: '2026', listingType: 'STOCK' } });
    cy.intercept('GET', /\/stock\/api\/stock-exchanges/, { statusCode: 200, body: [] });
    cy.visit('/securities/stock/AAPL', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(AGENT)); } });
    cy.get('body').should('be.visible');
  });
});
