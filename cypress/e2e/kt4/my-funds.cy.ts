// cypress/e2e/kt4/my-funds.cy.ts
// Celina 4 — Moji fondovi (Scenariji 20–24)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['BANKING_BASIC'],
};

const SUPERVISOR_USER = {
  email: 'supervisor@bank.com',
  role: 'Supervisor',
  permissions: ['FUND_AGENT_MANAGE'],
};

const CLIENT_POSITIONS = [
  { fundId: 1, fundNaziv: 'Alpha Growth Fund', fundOpis: 'Fokus na tehnološki sektor', fundTotalValue: 150000, totalInvested: 10000, currentPositionValue: 12500, clientProfit: 2500, percentageOfFund: 0.0833, firstInvestedAt: '2025-03-15T10:00:00' },
  { fundId: 2, fundNaziv: 'Stable Income Fund', fundOpis: 'Konzervativni fond', fundTotalValue: 80000, totalInvested: 5000, currentPositionValue: 5100, clientProfit: 100, percentageOfFund: 0.0638, firstInvestedAt: '2025-07-01T14:00:00' },
];

const SUPERVISED_FUNDS = [
  { id: 1, naziv: 'Alpha Growth Fund', opis: 'Fokus na tehnološki sektor', totalValue: 150000, profit: 25000, likvidnaSredstva: 50000, datumKreiranja: '2025-01-15T00:00:00' },
  { id: 3, naziv: 'Emerging Markets Fund', opis: 'Investicije u rastuća tržišta', totalValue: 250000, profit: -8000, likvidnaSredstva: 30000, datumKreiranja: '2024-09-01T00:00:00' },
];

function interceptPortfolio() {
  cy.intercept('GET', /\/order\/portfolio/, {
    statusCode: 200,
    body: { holdings: [], summary: { totalProfit: 0, yearlyTaxPaid: 0, monthlyTaxDue: 0 } },
  }).as('getHoldings');
}

// ─── Scenario 20 ───

describe('Scenario 20: Tab "Moji fondovi" u portfoliju', () => {

  it('Prikazuje klijentove pozicije u fondovima', () => {
    interceptPortfolio();
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: CLIENT_POSITIONS }).as('getMyPositions');

    cy.visit('/portfolio', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getHoldings');

    cy.contains('button', 'Moji fondovi').should('be.visible').click();
    cy.wait('@getMyPositions');

    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('Stable Income Fund').should('be.visible');
  });
});

// ─── Scenario 21 ───

describe('Scenario 21: Prikaz pozicije u fondu', () => {

  it('Naziv, vrednost fonda, udeo i profit', () => {
    interceptPortfolio();
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: CLIENT_POSITIONS }).as('getMyPositions');

    cy.visit('/portfolio', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getHoldings');

    cy.contains('button', 'Moji fondovi').click();
    cy.wait('@getMyPositions');

    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('2,500').should('be.visible');
  });
});

// ─── Scenario 22 ───

describe('Scenario 22: Uplata u fond', () => {

  it('Uplata sa izborom računa', () => {
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: CLIENT_POSITIONS }).as('getMyPositions');
    cy.intercept('POST', /\/funds\/\d+\/invest/, { statusCode: 200, body: { message: 'Uplata uspešna' } }).as('investInFund');

    cy.visit('/funds/my-funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getMyPositions');

    cy.contains('tr', 'Alpha Growth Fund').within(() => {
      cy.get('[data-testid="invest-btn"]').click();
    });

    cy.get('[data-testid="form-modal-overlay"]').should('be.visible');
    cy.get('#amount-input').type('2000');
    cy.get('#account-input').type('111222333444555666');
    cy.get('[data-testid="form-modal-confirm"]').click();

    cy.wait('@investInFund');
    cy.get('[data-testid="form-modal-overlay"]').should('not.exist');
  });
});

// ─── Scenario 23 ───

describe('Scenario 23: Povlačenje sredstava', () => {

  it('Povlačenje sa izborom računa', () => {
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: CLIENT_POSITIONS }).as('getMyPositions');
    cy.intercept('POST', /\/funds\/\d+\/redeem/, { statusCode: 200, body: { message: 'Isplata uspešna' } }).as('redeemFromFund');

    cy.visit('/funds/my-funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getMyPositions');

    cy.contains('tr', 'Alpha Growth Fund').within(() => {
      cy.get('[data-testid="redeem-btn"]').click();
    });

    cy.get('[data-testid="form-modal-overlay"]').should('be.visible');
    cy.get('#amount-input').type('500');
    cy.get('#account-input').type('111222333444555667');
    cy.get('[data-testid="form-modal-confirm"]').click();

    cy.wait('@redeemFromFund');
    cy.get('[data-testid="form-modal-overlay"]').should('not.exist');
  });
});

// ─── Scenario 24 ───

describe('Scenario 24: Supervisor – fondovi kojima upravlja', () => {

  it('Vidi naziv, vrednost, likvidnost, bez dugmadi za uplatu/povlačenje', () => {
    cy.intercept('GET', /\/funds\/supervised/, { statusCode: 200, body: SUPERVISED_FUNDS }).as('getSupervised');

    cy.visit('/funds/my-funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR_USER));
      },
    });
    cy.wait('@getSupervised');

    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('Emerging Markets Fund').should('be.visible');
    cy.contains('150,000').should('be.visible');

    cy.get('[data-testid="invest-btn"]').should('not.exist');
    cy.get('[data-testid="redeem-btn"]').should('not.exist');
  });
});
