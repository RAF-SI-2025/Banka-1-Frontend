// cypress/e2e/todo/fund-statistics.cy.ts
// TODO — Statistike fondova (Scenariji 9–12)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['BANKING_BASIC'],
};

const FUNDS_WITH_STATS = [
  { id: 1, naziv: 'Alpha Growth Fund', opis: 'Fokus na tehnološki sektor', minimumContribution: 1000, totalValue: 150000, profit: 25000, likvidnaSredstva: 50000, managerIme: 'Marko', managerPrezime: 'Marković', managerId: 10, accountNumber: '1234567890123456789', datumKreiranja: '2025-01-15', annualYield: 12.5, volatility: 8.3, rewardToVariabilityRatio: 1.5, maxDrawdown: -15.2 },
  { id: 2, naziv: 'Stable Income Fund', opis: 'Konzervativni fond', minimumContribution: 500, totalValue: 80000, profit: 5000, likvidnaSredstva: 20000, managerIme: 'Jelena', managerPrezime: 'Petrović', managerId: 11, accountNumber: '1234567890123456790', datumKreiranja: '2025-06-01', annualYield: 4.2, volatility: 3.1, rewardToVariabilityRatio: 1.35, maxDrawdown: -5.8 },
  { id: 3, naziv: 'Newly Created Fund', opis: 'Bez dovoljno podataka', minimumContribution: 2000, totalValue: 50000, profit: 0, likvidnaSredstva: 50000, managerIme: 'Nikola', managerPrezime: 'Nikolić', managerId: 12, accountNumber: '1234567890123456791', datumKreiranja: '2026-06-01', annualYield: null, volatility: null, rewardToVariabilityRatio: null, maxDrawdown: null },
];

function interceptFunds() {
  cy.intercept({ method: 'GET', url: /\/funds(\?|$)/ }, (req) => {
    if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
      req.reply({ statusCode: 200, body: FUNDS_WITH_STATS });
    } else {
      req.continue();
    }
  }).as('getFunds');
}

function visitFunds() {
  cy.visit('/funds', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

// ─── Scenario 9: Prikaz statistika ───

describe('Scenario 9: Statistike na Discovery page', () => {

  it('Fondovi prikazuju godišnji prinos, R/V Ratio, Max Drawdown i volatilnost', () => {
    interceptFunds();
    visitFunds();
    cy.wait('@getFunds');

    cy.contains('God. prinos').should('be.visible');
    cy.contains('Volatilnost').should('be.visible');
    cy.contains('R/V Ratio').should('be.visible');
    cy.contains('Max Drawdown').should('be.visible');
    cy.contains('12.5').should('be.visible');
  });
});

// ─── Scenario 10: Sortiranje po godišnjem prinosu ───

describe('Scenario 10: Sortiranje po godišnjem prinosu', () => {

  it('Klik na God. prinos sortira fondove', () => {
    interceptFunds();
    visitFunds();
    cy.wait('@getFunds');

    cy.contains('button', 'God. prinos').should('be.visible').click();
    cy.wait('@getFunds');
  });
});

// ─── Scenario 11: Fond bez podataka ───

describe('Scenario 11: Fond bez dovoljno podataka', () => {

  it('Prikazuje "Nedovoljno podataka" za fond bez istorije', () => {
    interceptFunds();
    visitFunds();
    cy.wait('@getFunds');

    cy.contains('Newly Created Fund').should('be.visible');
    cy.contains('Nedovoljno podataka').should('be.visible');
  });
});

// ─── Scenario 12: Grafikon istorijske vrednosti ───

describe('Scenario 12: Grafikon istorijske vrednosti', () => {

  it('Prikaz grafikona sa period filterima (1M, 3M, 1Y, ALL)', () => {
    cy.intercept({ method: 'GET', url: /\/funds\/1\b/ }, (req) => {
      if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
        req.reply({ statusCode: 200, body: FUNDS_WITH_STATS[0] });
      } else {
        req.continue();
      }
    }).as('getFundDetail');
    cy.intercept('GET', /\/funds\/1\/performance/, {
      statusCode: 200,
      body: [
        { date: '2026-01-01', value: 140000 }, { date: '2026-02-01', value: 145000 },
        { date: '2026-03-01', value: 142000 }, { date: '2026-04-01', value: 148000 },
        { date: '2026-05-01', value: 150000 },
      ],
    });
    cy.intercept('GET', /\/funds\/1\/securities/, { statusCode: 200, body: [] });
    cy.intercept('GET', /\/accounts\/client\/accounts/, { statusCode: 200, body: { content: [] } });
    cy.intercept('GET', /\/funds\/my-positions/, { statusCode: 200, body: [] });

    cy.visit('/funds/1', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getFundDetail');

    cy.contains('Performanse fonda').should('be.visible');
    cy.contains('Istorijska vrednost').should('be.visible');
    cy.get('button').contains('1M').should('be.visible');
    cy.get('button').contains('ALL').should('be.visible');
  });
});
