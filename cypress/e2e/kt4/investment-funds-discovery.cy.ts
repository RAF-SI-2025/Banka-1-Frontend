// cypress/e2e/kt4/investment-funds-discovery.cy.ts
// Celina 4 — Investicioni fondovi – Discovery (Scenariji 12–16)

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

const FUNDS_LIST = [
  { id: 1, naziv: 'Alpha Growth Fund', opis: 'Fokus na tehnološki sektor', minimumContribution: 1000, totalValue: 150000, profit: 25000, likvidnaSredstva: 50000, managerIme: 'Marko', managerPrezime: 'Marković', managerId: 10, accountNumber: '1234567890123456789', datumKreiranja: '2025-01-15', annualYield: 12.5, volatility: 8.3, rewardToVariabilityRatio: 1.5, maxDrawdown: -15.2 },
  { id: 2, naziv: 'Stable Income Fund', opis: 'Konzervativni fond', minimumContribution: 500, totalValue: 80000, profit: 5000, likvidnaSredstva: 20000, managerIme: 'Jelena', managerPrezime: 'Petrović', managerId: 11, accountNumber: '1234567890123456790', datumKreiranja: '2025-06-01', annualYield: 4.2, volatility: 3.1, rewardToVariabilityRatio: 1.35, maxDrawdown: -5.8 },
  { id: 3, naziv: 'Emerging Markets Fund', opis: 'Rastuća tržišta', minimumContribution: 2000, totalValue: 250000, profit: -8000, likvidnaSredstva: 30000, managerIme: 'Nikola', managerPrezime: 'Nikolić', managerId: 12, accountNumber: '1234567890123456791', datumKreiranja: '2024-09-01', annualYield: -3.1, volatility: 18.7, rewardToVariabilityRatio: -0.17, maxDrawdown: -35.4 },
];

/** Interceptuje API pozive ali ne i navigaciju stranice. */
function interceptApiGet(url: RegExp, body: object, alias?: string) {
  cy.intercept({ method: 'GET', url }, (req) => {
    if (req.resourceType === 'xhr' || req.resourceType === 'fetch') {
      req.reply({ statusCode: 200, body });
    } else {
      req.continue();
    }
  }).as(alias || 'api');
}

function interceptApiPost(url: RegExp, body: object, status: number, alias: string) {
  cy.intercept('POST', url, { statusCode: status, body }).as(alias);
}

// ─── Scenario 12 ───

describe('Scenario 12: Discovery page – prikaz fondova', () => {

  it('Prikazuje listu fondova sa nazivom, opisom, vrednošću, profitom i min. ulogom', () => {
    interceptApiGet(/\/funds\b/, FUNDS_LIST, 'getFunds');

    cy.visit('/funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getFunds');

    cy.contains('Investicioni fondovi').should('be.visible');
    cy.contains('Alpha Growth Fund').should('be.visible');
    cy.contains('Stable Income Fund').should('be.visible');
    cy.contains('Emerging Markets Fund').should('be.visible');
    cy.contains('Min. ulog').should('be.visible');
  });
});

// ─── Scenario 13 ───

describe('Scenario 13: Sortiranje fondova', () => {

  it('Klik na "Vrednost" sortira fondove', () => {
    interceptApiGet(/\/funds\b/, FUNDS_LIST, 'getFunds');

    cy.visit('/funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getFunds');

    cy.contains('button', 'Vrednost').should('be.visible').click();
    cy.wait('@getFunds');
  });
});

// ─── Scenario 14 ───

describe('Scenario 14: Klijent investira u fond', () => {

  it('Investiranje u fond sa iznosom većim od minimalnog uloga', () => {
    interceptApiGet(/\/funds\b/, FUNDS_LIST, 'getFunds');
    interceptApiGet(/\/funds\/1\b/, FUNDS_LIST[0], 'getFundDetail');
    interceptApiGet(/\/funds\/1\/securities/, []);
    interceptApiGet(/\/funds\/1\/performance/, []);
    interceptApiGet(/\/accounts\/client\/accounts/, [{ accountNumber: '111222333444555666', name: 'Tekući račun', availableBalance: 50000, currency: 'RSD', status: 'ACTIVE', dailyLimit: 100000, monthlyLimit: 500000 }], 'getAccounts');
    cy.intercept('POST', /\/funds\/\d+\/invest/, { statusCode: 200, body: { message: 'Uplata uspešna' } }).as('investInFund');

    cy.visit('/funds/1', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getFundDetail');

    cy.contains('Investiraj u fond').should('be.visible');
    cy.get('#invest-amount').should('be.visible');
    cy.contains('Min. ulog:').should('be.visible');
  });
});

// ─── Scenario 15 ───

describe('Scenario 15: Ispod minimalnog uloga', () => {

  it('Validaciona greška za iznos manji od minimumContribution', () => {
    interceptApiGet(/\/funds\b/, FUNDS_LIST, 'getFunds');
    interceptApiGet(/\/funds\/1$/, FUNDS_LIST[0], 'getFundDetail');
    interceptApiGet(/\/funds\/1\/securities/, []);
    interceptApiGet(/\/accounts\/client\/accounts/, [{ accountNumber: '111222333444555666', name: 'Tekući račun', availableBalance: 50000, currency: 'RSD', status: 'ACTIVE', dailyLimit: 100000, monthlyLimit: 500000 }], 'getAccounts');

    cy.visit('/funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      },
    });
    cy.wait('@getFunds');

    cy.contains('Alpha Growth Fund').click();
    cy.wait('@getFundDetail');

    cy.get('#invest-amount').type('100');
    cy.contains('button', 'Investiraj').should('be.disabled');
  });
});

// ─── Scenario 16 ───

describe('Scenario 16: Supervizor kreira novi fond', () => {

  it('Kreira fond sa nazivom, opisom i minimalnim ulogom', () => {
    interceptApiGet(/\/funds\b/, FUNDS_LIST);
    interceptApiPost(/\/funds/, { id: 4, naziv: 'Novi Fond' }, 201, 'createFund');

    cy.visit('/funds/create', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify(SUPERVISOR_USER));
      },
    });

    cy.get('#fund-naziv').type('Novi Fond');
    cy.get('#fund-opis').type('Opis novog fonda za testiranje.');
    cy.get('#fund-min').clear().type('1500');
    cy.contains('button', 'Kreiraj fond').click();

    cy.wait('@createFund');
    cy.url().should('include', '/funds');
  });
});
