// cypress/e2e/kt3/actuary-management.cy.ts
// KT3 — Upravljanje aktuarima (Supervizor: FUND_AGENT_MANAGE)

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const SUPERVISOR = { email: 's@b.com', role: 'Supervisor', permissions: ['FUND_AGENT_MANAGE'] };

const AGENTS = {
  content: [
    { employeeId: 1, ime: 'Petar', prezime: 'Petrović', email: 'petar@banka.com', pozicija: 'Senior Agent', limit: 500000, usedLimit: 120000, needApproval: false },
    { employeeId: 2, ime: 'Jovan', prezime: 'Jovanović', email: 'jovan@banka.com', pozicija: 'Junior Agent', limit: 100000, usedLimit: 95000, needApproval: true },
    { employeeId: 3, ime: 'Ana', prezime: 'Anić', email: 'ana@banka.com', pozicija: 'Agent', limit: 250000, usedLimit: 0, needApproval: false },
  ],
  totalElements: 3, totalPages: 1, number: 0,
};

function visit() {
  cy.intercept('GET', /\/order\/actuaries\/agents/, { statusCode: 200, body: AGENTS }).as('getAgents');
  cy.visit('/actuary-management', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN);
      win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR));
    },
  });
  cy.wait('@getAgents');
  cy.get('[data-cy="agents-table"]', { timeout: 15000 }).should('be.visible');
}

describe('KT3 — Aktuar Management', () => {

  it('Prikazuje tabelu sa svim agentima', () => {
    visit();
    cy.get('[data-cy="agents-table"]').within(() => {
      cy.contains('td', 'Petar Petrović').should('be.visible');
      cy.contains('td', 'Jovan Jovanović').should('be.visible');
      cy.contains('td', 'Ana Anić').should('be.visible');
    });
  });

  it('Filtrira agente po email-u', () => {
    visit();
    cy.get('[data-cy="filter-email"]').clear().type('petar');
    cy.wait(500);
    cy.wait('@getAgents');
    cy.get('[data-cy="agents-table"]').contains('td', 'Petar Petrović').should('be.visible');
  });

  it('Filtrira agente po imenu', () => {
    visit();
    cy.get('[data-cy="filter-name"]').clear().type('Ana');
    cy.wait(500);
    cy.wait('@getAgents');
    cy.get('[data-cy="agents-table"]').contains('td', 'Ana Anić').should('be.visible');
  });

  it('Filtrira agente po poziciji', () => {
    visit();
    cy.get('[data-cy="filter-position"]').clear().type('Senior');
    cy.wait(500);
    cy.wait('@getAgents');
    cy.get('[data-cy="agents-table"]').contains('td', 'Petar Petrović').should('be.visible');
  });

  it('Izmenjuje dodeljeni limit agentu', () => {
    cy.intercept('PUT', /\/order\/actuaries\/agents\/\d+\/limit/, { statusCode: 200, body: {} }).as('updateLimit');
    visit();
    cy.contains('tr', 'Petar Petrović').within(() => cy.get('[data-cy="edit-limit-btn"]').click());
    cy.get('[data-cy="edit-limit-input"]').clear().type('600000');
    cy.get('[data-cy="save-limit-btn"]').click();
    cy.wait('@updateLimit');
  });

  it('Otkazuje izmenu limita', () => {
    visit();
    cy.contains('tr', 'Petar Petrović').within(() => cy.get('[data-cy="edit-limit-btn"]').click());
    cy.get('[data-cy="edit-limit-input"]').should('be.visible');
    cy.get('[data-cy="cancel-limit-btn"]').click();
    cy.get('[data-cy="edit-limit-input"]').should('not.exist');
  });

  it('Resetuje iskorišćeni limit agentu', () => {
    cy.intercept('PUT', /\/order\/actuaries\/agents\/\d+\/reset-limit/, { statusCode: 200, body: {} }).as('resetLimit');
    visit();
    cy.contains('tr', 'Petar Petrović').within(() => cy.get('[data-cy="reset-limit-btn"]').click());
    cy.get('[data-cy="reset-confirm-dialog"]').should('be.visible');
    cy.get('[data-cy="confirm-reset-btn"]').click();
    cy.wait('@resetLimit');
  });

  it('Otkazuje resetovanje limita', () => {
    visit();
    cy.contains('tr', 'Petar Petrović').within(() => cy.get('[data-cy="reset-limit-btn"]').click());
    cy.get('[data-cy="reset-confirm-dialog"]').should('be.visible');
    cy.get('[data-cy="cancel-reset-btn"]').click();
    cy.get('[data-cy="reset-confirm-dialog"]').should('not.exist');
  });
});
