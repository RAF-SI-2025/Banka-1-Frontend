// cypress/e2e/kt4/investment-fund-details.cy.ts
// Celina 4 — Investicioni fondovi – Detalji (Scenariji 17–19)

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

const FUND_DETAIL = {
  id: 1, naziv: 'Alpha Growth Fund', opis: 'Fokus na tehnološki sektor — agresivna alokacija.',
  minimumContribution: 1000, totalValue: 150000, profit: 25000,
  likvidnaSredstva: 50000, managerIme: 'Marko', managerPrezime: 'Marković',
  managerId: 10, accountNumber: '1234567890123456789', datumKreiranja: '2025-01-15',
  annualYield: 12.5, volatility: 8.3, rewardToVariabilityRatio: 1.5, maxDrawdown: -15.2,
};

const FUND_SECURITIES = [
  { ticker: 'AAPL', quantity: 100, avgUnitPrice: 145.5, price: 150.0, change: 3.1, volume: 500000, initialMarginCost: 5000, acquisitionDate: '2025-06-01' },
  { ticker: 'MSFT', quantity: 80, avgUnitPrice: 310.0, price: 320.0, change: 3.23, volume: 300000, initialMarginCost: 8000, acquisitionDate: '2025-07-15' },
];

function interceptApiGet(url: RegExp, body: object, alias?: string) {
  cy.intercept({ method: 'GET', url }, (req) => {
    if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
      req.reply({ statusCode: 200, body });
    } else {
      req.continue();
    }
  }).as(alias || 'api');
}

function visitFundDetail(role: 'client' | 'supervisor') {
  const user = role === 'supervisor' ? SUPERVISOR_USER : CLIENT_USER;
  cy.visit('/funds/1', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });
}

// ─── Scenario 17 ───

describe('Scenario 17: Detaljan prikaz fonda', () => {

  it('Naziv, opis, menadžer, vrednost, likvidnost, min. ulog, profit, hartije', () => {
    interceptApiGet(/\/funds\/1\b/, FUND_DETAIL, 'getFundDetail');
    interceptApiGet(/\/funds\/1\/securities/, FUND_SECURITIES);
    interceptApiGet(/\/funds\/1\/performance/, []);
    interceptApiGet(/\/accounts\/client\/accounts/, []);
    interceptApiGet(/\/funds\/my-positions/, []);
    visitFundDetail('supervisor');
    cy.wait('@getFundDetail');

    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('Fokus na tehnološki sektor').should('be.visible');
    cy.contains('Likvidna sredstva').should('be.visible');
    cy.contains('Ukupna vrednost').should('be.visible');
    cy.contains('Profit').should('be.visible');
    cy.contains('Min. ulog').should('be.visible');
    cy.contains('Marko Marković').should('be.visible');
    cy.contains('Hartije fonda').should('be.visible');
  });
});

// ─── Scenario 18 ───

describe('Scenario 18: Supervisor vidi dugme Prodaj', () => {

  it('Supervisor vidi dugme Prodaj pored svake hartije', () => {
    interceptApiGet(/\/funds\/1\b/, FUND_DETAIL, 'getFundDetail');
    interceptApiGet(/\/funds\/1\/securities/, FUND_SECURITIES);
    interceptApiGet(/\/funds\/1\/performance/, []);
    interceptApiGet(/\/accounts\/client\/accounts/, []);
    visitFundDetail('supervisor');
    cy.wait('@getFundDetail');

    cy.contains('AAPL').closest('tr').within(() => {
      cy.contains('button', 'Prodaj').should('be.visible');
    });
    cy.contains('MSFT').closest('tr').within(() => {
      cy.contains('button', 'Prodaj').should('be.visible');
    });
  });
});

// ─── Scenario 19 ───

describe('Scenario 19: Klijent ne vidi dugme Prodaj', () => {

  it('Klijent ne vidi dugme Prodaj na hartijama fonda', () => {
    interceptApiGet(/\/funds\/1\b/, FUND_DETAIL, 'getFundDetail');
    interceptApiGet(/\/funds\/1\/securities/, FUND_SECURITIES);
    interceptApiGet(/\/funds\/1\/performance/, []);
    interceptApiGet(/\/accounts\/client\/accounts/, []);
    interceptApiGet(/\/funds\/my-positions/, []);
    visitFundDetail('client');
    cy.wait('@getFundDetail');

    cy.contains('Hartije fonda').should('be.visible');
    cy.contains('button', 'Prodaj').should('not.exist');
  });
});
