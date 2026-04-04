// cypress/e2e/actuary-management.cy.ts
// E2E testovi za Actuary Management (F12) komponentu

const MOCK_AGENTS = {
  content: [
    { id: 1, ime: 'Marko', prezime: 'Petrović', email: 'marko.p@banka.com', pozicija: 'Agent', limit: 100000, usedLimit: 15000, needApproval: false },
    { id: 2, ime: 'Jelena', prezime: 'Nikolić', email: 'jelena.n@banka.com', pozicija: 'Senior Agent', limit: 200000, usedLimit: 180000, needApproval: true },
    { id: 3, ime: 'Milan', prezime: 'Jovanović', email: 'milan.j@banka.com', pozicija: 'Agent', limit: 50000, usedLimit: 0, needApproval: false }
  ],
  totalElements: 3,
  totalPages: 1
};

const supervisorUser = {
  email: 'supervisor@banka.com',
  role: 'Supervisor',
  permissions: ['BANKING_BASIC', 'CLIENT_MANAGE', 'SECURITIES_TRADE_LIMITED', 'SECURITIES_TRADE_UNLIMITED', 'TRADE_UNLIMITED', 'OTC_TRADE', 'FUND_AGENT_MANAGE']
};

describe('Actuary Management Component (F12)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/actuaries/agents*', (req) => {
      req.reply({ statusCode: 200, body: MOCK_AGENTS });
    }).as('getAgents');

    window.localStorage.setItem('authToken', 'fake-jwt-token');
    window.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));

    cy.visit('/actuary-management');
    cy.wait('@getAgents');
  });

  it('treba da prikaže naslov stranice i opis', () => {
    cy.contains('Upravljanje aktuarima').should('be.visible');
    cy.contains('Pregledajte i upravljajte agentima i njihovim limitima').should('be.visible');
  });

  it('treba da prikaže tabelu sa svim agentima', () => {
    cy.get('[data-cy="agents-table"] tbody tr').should('have.length', 3);
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', 'Marko Petrović');
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', 'marko.p@banka.com');
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', 'Agent');
  });

  it('treba da prikaže kolone tabele ispravno', () => {
    cy.get('[data-cy="agents-table"] thead th').should('have.length', 6);
    cy.get('[data-cy="agents-table"] thead th').eq(0).should('contain', 'Ime i prezime');
    cy.get('[data-cy="agents-table"] thead th').eq(1).should('contain', 'Email');
    cy.get('[data-cy="agents-table"] thead th').eq(2).should('contain', 'Pozicija');
    cy.get('[data-cy="agents-table"] thead th').eq(3).should('contain', 'Limit');
    cy.get('[data-cy="agents-table"] thead th').eq(4).should('contain', 'limit');
  });

  it('treba da prikaže formatirane vrednosti limita', () => {
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', '100.000,00');
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', '15.000,00');
  });

  // === FILTERI ===

  it('treba da filtrira agente po emailu', () => {
    cy.intercept('GET', '**/actuaries/agents*', (req) => {
      if (req.url.includes('email=jelena')) {
        req.reply({
          statusCode: 200,
          body: {
            content: [MOCK_AGENTS.content[1]],
            totalElements: 1,
            totalPages: 1
          }
        });
      } else {
        req.reply({ statusCode: 200, body: MOCK_AGENTS });
      }
    }).as('filterAgents');

    cy.get('[data-cy="filter-email"]').type('jelena');
    cy.wait('@filterAgents');
    cy.get('[data-cy="agents-table"] tbody tr').should('have.length', 1);
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', 'Jelena Nikolić');
  });

  it('treba da filtrira agente po imenu i prezimenu', () => {
    cy.intercept('GET', '**/actuaries/agents*', (req) => {
      if (req.url.includes('ime=Milan')) {
        req.reply({
          statusCode: 200,
          body: {
            content: [MOCK_AGENTS.content[2]],
            totalElements: 1,
            totalPages: 1
          }
        });
      } else {
        req.reply({ statusCode: 200, body: MOCK_AGENTS });
      }
    }).as('filterByName');

    cy.get('[data-cy="filter-name"]').type('Milan');
    cy.wait('@filterByName');
    cy.get('[data-cy="agents-table"] tbody tr').should('have.length', 1);
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', 'Milan Jovanović');
  });

  it('treba da filtrira agente po poziciji', () => {
    cy.intercept('GET', '**/actuaries/agents*', (req) => {
      if (req.url.includes('pozicija=Senior')) {
        req.reply({
          statusCode: 200,
          body: {
            content: [MOCK_AGENTS.content[1]],
            totalElements: 1,
            totalPages: 1
          }
        });
      } else {
        req.reply({ statusCode: 200, body: MOCK_AGENTS });
      }
    }).as('filterByPosition');

    cy.get('[data-cy="filter-position"]').type('Senior');
    cy.wait('@filterByPosition');
    cy.get('[data-cy="agents-table"] tbody tr').should('have.length', 1);
    cy.get('[data-cy="agents-table"] tbody tr').first().should('contain', 'Senior Agent');
  });

  // === IZMENI LIMIT ===

  it('treba da otvori inline edit formu za limit klikom na edit dugme', () => {
    cy.get('[data-cy="agents-table"] tbody tr').first().find('[data-cy="edit-limit-btn"]').click();
    cy.get('[data-cy="edit-limit-input"]').should('be.visible');
    cy.get('[data-cy="save-limit-btn"]').should('be.visible');
    cy.get('[data-cy="cancel-limit-btn"]').should('be.visible');
  });

  it('treba da sačuva novi limit nakon edit-a', () => {
    cy.intercept('PUT', '**/actuaries/agents/1/limit', {
      statusCode: 200,
      body: { ...MOCK_AGENTS.content[0], limit: 150000 }
    }).as('updateLimit');

    cy.get('[data-cy="agents-table"] tbody tr').first().find('[data-cy="edit-limit-btn"]').click();
    cy.get('[data-cy="edit-limit-input"]').clear().type('150000');
    cy.get('[data-cy="save-limit-btn"]').click();

    cy.wait('@updateLimit');
    cy.get('[data-cy="edit-limit-input"]').should('not.exist');
  });

  it('treba da otkaže edit limita klikom na Otkaži', () => {
    cy.get('[data-cy="agents-table"] tbody tr').first().find('[data-cy="edit-limit-btn"]').click();
    cy.get('[data-cy="edit-limit-input"]').should('be.visible');
    cy.get('[data-cy="cancel-limit-btn"]').click();
    cy.get('[data-cy="edit-limit-input"]').should('not.exist');
  });

  // === RESETUJ LIMIT ===

  it('treba da otvori confirm dijalog za reset limita', () => {
    cy.get('[data-cy="agents-table"] tbody tr').first().find('[data-cy="reset-limit-btn"]').click();
    cy.get('[data-cy="reset-confirm-dialog"]').should('be.visible');
    cy.contains('Resetuj iskorišćeni limit').should('be.visible');
    cy.contains('Da li ste sigurni').should('be.visible');
  });

  it('treba da zatvori confirm dijalog klikom na Odustani', () => {
    cy.get('[data-cy="agents-table"] tbody tr').first().find('[data-cy="reset-limit-btn"]').click();
    cy.get('[data-cy="reset-confirm-dialog"]').should('be.visible');
    cy.get('[data-cy="cancel-reset-btn"]').click();
    cy.get('[data-cy="reset-confirm-dialog"]').should('not.exist');
  });

  it('treba da resetuje usedLimit na 0 nakon potvrde', () => {
    cy.intercept('POST', '**/actuaries/agents/1/reset-used-limit', {
      statusCode: 200,
      body: { ...MOCK_AGENTS.content[0], usedLimit: 0 }
    }).as('resetLimit');

    cy.get('[data-cy="agents-table"] tbody tr').first().find('[data-cy="reset-limit-btn"]').click();
    cy.get('[data-cy="confirm-reset-btn"]').click();

    cy.wait('@resetLimit');
    cy.get('[data-cy="reset-confirm-dialog"]').should('not.exist');
  });

  // === EMPTY STATE ===

  it('treba da prikaže empty state kada nema agenata', () => {
    cy.intercept('GET', '**/actuaries/agents*', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 }
    }).as('emptyAgents');

    cy.visit('/actuary-management');
    cy.wait('@emptyAgents');
    cy.contains('Nema pronađenih agenata.').should('be.visible');
  });

  // === PAGINACIJA ===

  it('treba da prikaže pagination informacije', () => {
    cy.contains('Redova po stranici:').should('be.visible');
    cy.contains('od 3').should('be.visible');
  });

  // === PRISTUP ===

  it('treba da preusmeri korisnika bez permisija na /403', () => {
    window.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'basic@banka.com',
      role: 'Basic',
      permissions: ['BANKING_BASIC']
    }));

    cy.visit('/actuary-management');
    cy.url().should('include', '/403');
  });

  it('treba da preusmeri neulogovanog korisnika na /login', () => {
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('loggedUser');

    cy.visit('/actuary-management');
    cy.url().should('include', '/login');
  });

  // === NAVIGACIJA ===

  it('treba da prikaže link za upravljanje aktuarima u sidebar-u za supervizora', () => {
    cy.get('nav').contains('Upravljanje aktuarima').should('be.visible');
  });

  it('ne treba da prikaže link za upravljanje aktuarima za običnog zaposlenog', () => {
    window.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'basic@banka.com',
      role: 'Basic',
      permissions: ['BANKING_BASIC', 'CLIENT_MANAGE']
    }));

    cy.visit('/employees');
    cy.intercept('GET', '**/employees*', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } }).as('emp');

    cy.get('nav').contains('Upravljanje aktuarima').should('not.exist');
  });
});
