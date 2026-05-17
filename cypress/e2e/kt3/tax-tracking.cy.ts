// cypress/e2e/kt3/tax-tracking.cy.ts
// Scenarios 74–79: Porez tracking
export {};

const MOCK_TAX_USERS = {
  content: [
    { firstName: 'Marko', lastName: 'Petrović', userType: 'CLIENT', taxDebtRsd: 5000, currentMonthTaxRsd: 1500, lastTaxCalculationDate: '2025-04-30' },
    { firstName: 'Jelena', lastName: 'Nikolić', userType: 'CLIENT', taxDebtRsd: 0, currentMonthTaxRsd: 300, lastTaxCalculationDate: '2025-04-30' },
    { firstName: 'Ivan', lastName: 'Jovanović', userType: 'ACTUARY', taxDebtRsd: 2000, currentMonthTaxRsd: 600, lastTaxCalculationDate: '2025-04-30' },
  ],
  totalElements: 3,
  totalPages: 1,
  number: 0,
  size: 10,
};

const supervisorUser = {
  email: 'supervisor@banka.com',
  role: 'Supervisor',
  permissions: ['BANKING_BASIC', 'SECURITIES_TRADE_UNLIMITED', 'FUND_AGENT_MANAGE'],
};

const clientUser = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['SECURITIES_TRADE_LIMITED'],
};

const visitTaxAs = (user: object) => {
  cy.visit('/tax-tracking', {
    onBeforeLoad: (win) => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });
};

// Scenario 74: Supervizor pristupa portalu za porez tracking
describe('Scenario 74: Supervizor pristupa tax portalu', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/order/tax/tracking*', {
      statusCode: 200,
      body: MOCK_TAX_USERS,
    }).as('getTaxUsers');

    visitTaxAs(supervisorUser);
    cy.wait('@getTaxUsers');
  });

  it('supervizor vidi naslov "Porez tracking"', () => {
    cy.contains(/porez tracking|tax tracking/i).should('be.visible');
  });

  it('supervizor vidi listu korisnika sa dugovanjima', () => {
    cy.contains('Marko').should('be.visible');
    cy.contains('Jelena').should('be.visible');
  });

  it('prikazuje dugovanja u RSD', () => {
    cy.contains(/RSD|din/i).should('be.visible');
  });
});

// Scenario 75: Klijent nema pristup portalu za porez
describe('Scenario 75: Klijent nema pristup tax portalu', () => {
  it('klijent se preusmerava na /403', () => {
    visitTaxAs(clientUser);
    cy.url().should('include', '/403');
  });
});

// Scenario 76: Filtriranje po tipu korisnika
describe('Scenario 76: Filter po tipu korisnika', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/order/tax/tracking*', (req) => {
      if (req.url.includes('userType=CLIENT') || req.url.includes('type=CLIENT')) {
        req.reply({
          statusCode: 200,
          body: {
            ...MOCK_TAX_USERS,
            content: MOCK_TAX_USERS.content.filter(u => u.userType === 'CLIENT'),
            totalElements: 2,
          },
        });
      } else {
        req.reply({ statusCode: 200, body: MOCK_TAX_USERS });
      }
    }).as('getTaxUsers');

    visitTaxAs(supervisorUser);
    cy.wait('@getTaxUsers');
  });

  it('filter po tipu "klijent" prikazuje samo klijente', () => {
    cy.get('select[id*=type], select[name*=type], select[formcontrolname*=type]').first().select('CLIENT');
    cy.wait('@getTaxUsers');
    cy.contains('Ivan').should('not.exist');
    cy.contains('Marko').should('be.visible');
  });
});

// Scenario 77: Filtriranje po imenu
describe('Scenario 77: Filter po imenu korisnika', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/order/tax/tracking*', (req) => {
      if (req.url.includes('search=Jelena') || req.url.includes('name=Jelena')) {
        req.reply({
          statusCode: 200,
          body: {
            ...MOCK_TAX_USERS,
            content: [MOCK_TAX_USERS.content[1]],
            totalElements: 1,
          },
        });
      } else {
        req.reply({ statusCode: 200, body: MOCK_TAX_USERS });
      }
    }).as('getTaxUsers');

    visitTaxAs(supervisorUser);
    cy.wait('@getTaxUsers');
  });

  it('pretraga po imenu filtrira korisnike', () => {
    cy.get('input[id*=search], input[id*=tax-search], input[placeholder*=pretraga]').first().type('Jelena');
    // filtering is client-side (filterData()), no second API call
    cy.contains('Jelena').should('be.visible');
    cy.contains('Marko').should('not.exist');
  });
});

// Scenario 79: Ručno pokretanje obračuna poreza
describe('Scenario 79: Ručno pokretanje obračuna poreza', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/order/tax/tracking*', {
      statusCode: 200,
      body: MOCK_TAX_USERS,
    }).as('getTaxUsers');

    cy.intercept('POST', '**/order/tax/collect*', {
      statusCode: 200,
      body: { message: 'Tax calculation completed successfully' },
    }).as('calculateTax');

    visitTaxAs(supervisorUser);
    cy.wait('@getTaxUsers');
  });

  it('dugme za pokretanje obračuna poreza je vidljivo', () => {
    cy.contains('button', /pokreni obracun|start calculation|calculate tax/i).should('be.visible');
  });

  it('klik na dugme za obračun poziva API', () => {
    cy.contains('button', /pokreni obracun|start calculation|calculate tax/i).first().click();
    cy.wait('@calculateTax');
    cy.get('@calculateTax').its('response.statusCode').should('eq', 200);
  });

  it('prikazuje potvrdu uspešnog obračuna', () => {
    cy.contains('button', /pokreni obracun|start calculation|calculate tax/i).first().click();
    cy.wait('@calculateTax');
    cy.contains(/uspešno|success|completed/i).should('be.visible');
  });
});

// Pristup bez autentikacije
describe('Tax tracking – pristup bez tokena', () => {
  it('preusmerava na login bez tokena', () => {
    cy.visit('/tax-tracking', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
      },
    });
    cy.url().should('include', '/login');
  });
});
