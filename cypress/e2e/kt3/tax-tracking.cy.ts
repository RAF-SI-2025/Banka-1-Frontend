// cypress/e2e/kt3/tax-tracking.cy.ts
// KT3 — Porez tracking (Supervizor/Admin/EmployeeAdmin)

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['FUND_AGENT_MANAGE'] };

const TAX_DATA = {
  content: [
    { firstName: 'Marko', lastName: 'Petrović', userType: 'CLIENT', taxDebtRsd: 5000, currentMonthTaxRsd: 1500, totalPaidTaxRsd: 12000, lastTaxCalculationDate: '2025-04-30', status: 'ACTIVE' },
    { firstName: 'Jelena', lastName: 'Nikolić', userType: 'CLIENT', taxDebtRsd: 0, currentMonthTaxRsd: 300, totalPaidTaxRsd: 8000, lastTaxCalculationDate: '2025-04-30', status: 'PAID' },
    { firstName: 'Ivan', lastName: 'Jovanović', userType: 'ACTUARY', taxDebtRsd: 2000, currentMonthTaxRsd: 600, totalPaidTaxRsd: 5000, lastTaxCalculationDate: '2025-04-30', status: 'PENDING' },
  ],
  totalElements: 3, totalPages: 1, number: 0, size: 10,
};

function visit() {
  cy.intercept('GET', /\/order\/tax\/tracking/, { statusCode: 200, body: TAX_DATA }).as('getTax');
  cy.visit('/tax-tracking', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN);
      win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR));
    },
  });
  cy.wait('@getTax');
  cy.contains('h1', 'Porez tracking', { timeout: 15000 }).should('be.visible');
}

describe('KT3 — Porez tracking', () => {

  it('Prikazuje tabelu sa klijentima i aktuarima', () => {
    visit();
    cy.contains('Marko Petrović').should('be.visible');
    cy.contains('Jelena Nikolić').should('be.visible');
    cy.contains('Ivan Jovanović').should('be.visible');
    cy.contains('th', 'Trenutni dug').should('be.visible');
  });

  it('Filtrira po tipu — Klijenti', () => {
    visit();
    cy.get('#tax-type').select('CLIENT');
    cy.wait('@getTax');
    cy.contains('Marko Petrović').should('be.visible');
    cy.contains('Ivan Jovanović').should('not.exist');
  });

  it('Pretražuje po imenu', () => {
    visit();
    cy.get('#tax-search').clear().type('Jelena');
    cy.contains('Jelena Nikolić').should('be.visible');
    cy.contains('Marko Petrović').should('not.exist');
  });

  it('Pokreće obračun poreza', () => {
    cy.intercept('POST', /\/order\/tax\/collect/, { statusCode: 200 }).as('collect');
    visit();
    cy.contains('button', 'Pokreni obracun').click();
    cy.wait('@collect');
    cy.wait('@getTax');
  });

  it('Pokreće obračun za tekući mesec', () => {
    cy.intercept('POST', /\/tax\/collect\/current-month/, { statusCode: 200 }).as('monthCollect');
    visit();
    cy.contains('button', 'Pokreni obracun za ovaj mesec').click();
    cy.wait('@monthCollect');
    cy.wait('@getTax');
  });

  it('Prikazuje statuse — Plaćeno, Na čekanju', () => {
    visit();
    cy.contains('Placeno').should('be.visible');
    cy.contains('Na cekanju').should('be.visible');
  });
});
