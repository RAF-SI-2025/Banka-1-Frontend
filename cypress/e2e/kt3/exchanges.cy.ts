// cypress/e2e/kt3/exchanges.cy.ts
// KT3 — Berze (Supervizor/Admin)

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['FUND_AGENT_MANAGE'] };

const EXCHANGES = [
  { id: 1, exchangeName: 'New York Stock Exchange', exchangeAcronym: 'NYSE', exchangeMICCode: 'XNYS', polity: 'USA', currency: 'USD', timeZone: 'America/New_York', openTime: '09:30', closeTime: '16:00', isActive: true },
  { id: 2, exchangeName: 'NASDAQ', exchangeAcronym: 'NASDAQ', exchangeMICCode: 'XNAS', polity: 'USA', currency: 'USD', timeZone: 'America/New_York', openTime: '09:30', closeTime: '16:00', isActive: false },
  { id: 3, exchangeName: 'London Stock Exchange', exchangeAcronym: 'LSE', exchangeMICCode: 'XLON', polity: 'UK', currency: 'GBP', timeZone: 'Europe/London', openTime: '08:00', closeTime: '16:30', isActive: true },
];

function visit() {
  cy.intercept('GET', /\/stock\/api\/stock-exchanges/, { statusCode: 200, body: EXCHANGES }).as('getExchanges');
  cy.visit('/stock-exchange', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN);
      win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR));
    },
  });
  cy.wait('@getExchanges');
  cy.contains('h1', 'Berze', { timeout: 15000 }).should('be.visible');
}

describe('KT3 — Berze', () => {

  it('Prikazuje tabelu sa berzama', () => {
    visit();
    cy.get('table').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 1);
    cy.contains('New York Stock Exchange').should('be.visible');
    cy.contains('NASDAQ').should('be.visible');
  });

  it('Prikazuje obavezne kolone', () => {
    visit();
    cy.contains('th', 'Naziv berze').should('be.visible');
    cy.contains('th', 'Akronim').should('be.visible');
    cy.contains('th', 'MIC').should('be.visible');
    cy.contains('th', 'Valuta').should('be.visible');
  });

  it('Prikazuje status badge', () => {
    visit();
    cy.get('tbody tr').first().within(() => {
      cy.contains(/Otvorena|Zatvorena/).should('be.visible');
    });
  });

  it('Toggle dugme postoji za svaku berzu', () => {
    visit();
    cy.get('tbody tr').first().contains('button', /Ukljuceno|Iskljuceno/).should('exist');
    cy.get('tbody tr').eq(1).contains('button', /Ukljuceno|Iskljuceno/).should('exist');
  });

  it('Klik na toggle poziva API', () => {
    cy.intercept('PUT', /\/stock\/api\/stock-exchanges\/\d+\/toggle/, { statusCode: 200 }).as('toggle');
    visit();
    cy.get('tbody tr').first().contains('button', /Ukljuceno|Iskljuceno/).click();
    cy.wait('@toggle');
  });

  it('isActive=true → Ukljuceno', () => {
    visit();
    cy.get('tbody tr').first().contains('button', 'Ukljuceno').should('exist');
  });

  it('isActive=false → Iskljuceno', () => {
    visit();
    cy.get('tbody tr').eq(1).contains('button', 'Iskljuceno').should('exist');
  });
});
