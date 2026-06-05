// cypress/e2e/kt4/bank-profit-portal.cy.ts
// Celina 4 — Profit Banke (Scenariji 25–27)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const SUPERVISOR_USER = {
  email: 'supervisor@bank.com',
  role: 'Supervisor',
  permissions: ['FUND_AGENT_MANAGE'],
};

// ActuaryProfit interfejs: userId, totalCommission, transactionCount, ime?, prezime?, pozicija?
const ACTUARY_ROWS = [
  { userId: 1, totalCommission: 15000.5, transactionCount: 42, ime: 'Petar', prezime: 'Petrović', pozicija: 'Senior Agent' },
  { userId: 2, totalCommission: 3200.75, transactionCount: 18, ime: 'Jovan', prezime: 'Jovanović', pozicija: 'Junior Agent' },
  { userId: 3, totalCommission: 8750.0, transactionCount: 31, ime: 'Ana', prezime: 'Anić', pozicija: 'Agent' },
];

const BANK_POSITIONS = [
  { fundId: 1, totalInvested: 50000, currentPositionValue: 62500, clientProfit: 12500, percentageOfFund: 0.4167 },
  { fundId: 2, totalInvested: 20000, currentPositionValue: 20400, clientProfit: 400, percentageOfFund: 0.255 },
];

const FUNDS_FOR_POSITIONS = [
  { id: 1, naziv: 'Alpha Growth Fund' },
  { id: 2, naziv: 'Stable Income Fund' },
];

function visitAsSupervisor(url: string) {
  cy.visit(url, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR_USER));
    },
  });
}

// ─── Scenario 25 ───

describe('Scenario 25: Profit aktuara', () => {

  it('Prikazuje tabelu sa imenom, pozicijom, brojem transakcija i profitom', () => {
    cy.intercept('GET', /\/order\/actuaries\/profit/, {
      statusCode: 200,
      body: ACTUARY_ROWS,
    }).as('getActuaries');

    visitAsSupervisor('/funds/profit-aktuara');
    cy.wait('@getActuaries');

    cy.contains('Profit aktuara').should('be.visible');
    cy.contains('th', 'Aktuar').should('be.visible');
    cy.contains('th', 'Pozicija').should('be.visible');
    cy.contains('th', 'Broj transakcija').should('be.visible');
    cy.contains('th', 'Total komisija').should('be.visible');
    cy.contains('td', 'Petar Petrović').should('be.visible');
    cy.contains('td', 'Jovan Jovanović').should('be.visible');
    cy.contains('td', 'Ana Anić').should('be.visible');
  });
});

// ─── Scenario 26 ───

describe('Scenario 26: Pozicije banke u fondovima', () => {

  it('Prikazuje naziv, udeo i profit pozicija banke', () => {
    cy.intercept('GET', /\/order\/actuaries\/profit\/bank-summary/, {
      statusCode: 200,
      body: { totalCommission: 26950.25, transactionCount: 91, distinctActuaries: 3 },
    });
    cy.intercept('GET', /\/funds\/bank-positions/, {
      statusCode: 200,
      body: BANK_POSITIONS,
    }).as('getBankPositions');
    // ProfitBanke komponenta ucitava i sve fondove za mapiranje naziva
    cy.intercept('GET', /\/funds(\?|$)/, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
        req.reply({ statusCode: 200, body: FUNDS_FOR_POSITIONS });
      } else {
        req.continue();
      }
    });

    visitAsSupervisor('/funds/profit-banke');
    cy.wait('@getBankPositions');

    cy.contains('Profit Banke').should('be.visible');
    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('Stable Income Fund').should('be.visible');
  });
});

// ─── Scenario 27 ───

describe('Scenario 27: Uplata banke u fond', () => {

  it('Uplata banke u fond sa izborom bankovnog računa', () => {
    cy.intercept('GET', /\/order\/actuaries\/profit\/bank-summary/, {
      statusCode: 200,
      body: { totalCommission: 26950.25, transactionCount: 91, distinctActuaries: 3 },
    });
    cy.intercept('GET', /\/funds\/bank-positions/, {
      statusCode: 200,
      body: BANK_POSITIONS,
    }).as('getBankPositions');
    cy.intercept('GET', /\/funds(\?|$)/, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
        req.reply({ statusCode: 200, body: FUNDS_FOR_POSITIONS });
      } else {
        req.continue();
      }
    });
    cy.intercept('POST', /\/funds\/\d+\/bank-invest/, {
      statusCode: 200,
      body: { message: 'Uplata banke uspešna' },
    }).as('bankInvest');

    visitAsSupervisor('/funds/profit-banke');
    cy.wait('@getBankPositions');

    cy.contains('tr', 'Alpha Growth Fund').within(() => {
      cy.contains('button', 'Uplati').click();
    });

    cy.get('#bank-amount-input').type('10000');
    cy.get('#bank-account-input').type('999888777666555444');
    cy.get('[data-testid="form-modal-confirm"]').click();

    cy.wait('@bankInvest');
  });
});
