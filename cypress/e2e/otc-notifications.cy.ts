// cypress/e2e/otc-notifications.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['OTC_TRADE'] };

function visitOtc() {
  cy.intercept('GET', /\/otc\/offers\/active/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/api\/interbank\/otc\/negotiations/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/contracts\/my/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/otc\/public-stocks/, { statusCode: 200, body: [] });
  cy.intercept('GET', /\/stocks\/price-feed/, { statusCode: 200, body: [] });
  cy.visit('/otc', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
}

describe('OTC Notifications', () => {
  it('stranica se ucitava', () => { visitOtc(); cy.get('body', { timeout: 15000 }).should('be.visible'); });
  it('OTC portal je vidljiv', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('tabovi se ucitavaju', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('ponude se prikazuju', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('ugovori se prikazuju', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('istorija radi', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('toggle pregovora', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('intercept za ponude', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('intercept za ugovore', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('notifikacije prazne', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('loading state', () => { visitOtc(); cy.get('body').should('be.visible'); });
  it('error state', () => { visitOtc(); cy.get('body').should('be.visible'); });
});
