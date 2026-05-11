// cypress/e2e/fund-discovery.cy.ts
// E2E testovi za Fund Discovery komponentu
export {};

const MOCK_FUNDS = [
  {
    id: 1,
    name: 'Global Growth Fund',
    description: 'Fond usmeren na rast globalnih tržišta.',
    totalValue: 125000000,
    profit: 12.5,
    minimumContribution: 50000,
  },
  {
    id: 2,
    name: 'Stable Income Fund',
    description: 'Konzervativni fond fokusiran na stabilne prihode.',
    totalValue: 85000000,
    profit: 5.2,
    minimumContribution: 10000,
  },
  {
    id: 3,
    name: 'Tech Innovation Fund',
    description: 'Fond koji investira u tehnološke kompanije.',
    totalValue: 200000000,
    profit: -2.1,
    minimumContribution: 100000,
  },
];

const MOCK_ACCOUNTS = [
  {
    accountNumber: '265000000011111111',
    name: 'Transakcioni račun',
    availableBalance: 200000,
    currency: 'RSD',
    status: 'ACTIVE',
  },
  {
    accountNumber: '265000000022222222',
    name: 'Štedni račun',
    availableBalance: 50000,
    currency: 'RSD',
    status: 'ACTIVE',
  },
];

const MOCK_PAGE = {
  content: MOCK_FUNDS,
  totalElements: 3,
  totalPages: 1,
  number: 0,
  size: 10,
};

const setClientAuth = (): void => {
  cy.window().then((win: any) => {
    win.localStorage.setItem('authToken', 'fake-jwt-token');
    win.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'klijent@test.com',
      role: 'Client',
      permissions: [],
    }));
  });
};

const setSupervisorAuth = (): void => {
  cy.window().then((win: any) => {
    win.localStorage.setItem('authToken', 'fake-jwt-token');
    win.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'supervisor@test.com',
      role: 'Supervisor',
      permissions: ['FUND_AGENT_MANAGE'],
    }));
  });
};

const clearAuth = (): void => {
  cy.window().then((win: any) => {
    win.localStorage.removeItem('authToken');
    win.localStorage.removeItem('loggedUser');
  });
};

const interceptFunds = (body = MOCK_PAGE): void => {
  cy.intercept('GET', '**/funds*', { statusCode: 200, body }).as('getFunds');
};

const interceptAccounts = (): void => {
  cy.intercept('GET', '**/accounts/client/accounts*', {
    statusCode: 200,
    body: { content: MOCK_ACCOUNTS, totalElements: 2, totalPages: 1 },
  }).as('getAccounts');
};

// ===========================================================
// Klijent
// ===========================================================

describe('Fund Discovery — klijent', () => {

  beforeEach(() => {
    interceptFunds();
    interceptAccounts();
    setClientAuth();
    cy.visit('/funds');
    cy.wait('@getFunds');
  });

  it('prikazuje naslov stranice', () => {
    cy.get('h1').should('contain', 'Fondovi');
  });

  it('prikazuje tabelu sa fondovima', () => {
    cy.get('[data-cy="funds-table"]').should('exist');
    cy.get('[data-cy="funds-table"] tbody tr').should('have.length', 3);
  });

  it('prikazuje naziv, opis i finansijske podatke fonda', () => {
    cy.get('[data-cy="funds-table"] tbody tr').first()
      .should('contain', 'Global Growth Fund')
      .and('contain', 'Fond usmeren na rast');
  });

  it('prikazuje pozitivan profit zelenom bojom', () => {
    cy.get('[data-cy="funds-table"] tbody tr').first()
      .find('td.text-green-600').should('contain', '+12.50%');
  });

  it('prikazuje negativan profit crvenom bojom', () => {
    cy.get('[data-cy="funds-table"] tbody tr').eq(2)
      .find('td.text-red-600').should('contain', '-2.10%');
  });

  it('prikazuje dugme "Investiraj" za svaki red', () => {
    cy.get('[data-cy="invest-btn"]').should('have.length', 3);
  });

  it('ne prikazuje dugme "Kreiraj fond"', () => {
    cy.get('[data-cy="create-fund-btn"]').should('not.exist');
  });

  // ===========================================================
  // Pretraga
  // ===========================================================

  it('poziva API sa search parametrom pri pretrazi', () => {
    interceptFunds({ ...MOCK_PAGE, content: [MOCK_FUNDS[2]], totalElements: 1 });
    cy.get('[data-cy="search-input"]').type('Tech');
    cy.wait('@getFunds').its('request.url').should('include', 'search=Tech');
    cy.get('[data-cy="funds-table"] tbody tr').should('have.length', 1);
  });

  // ===========================================================
  // Sortiranje
  // ===========================================================

  it('sortira po nazivu klikom na zaglavlje', () => {
    interceptFunds();
    cy.get('[data-cy="funds-table"] thead button').contains('Naziv').click();
    cy.wait('@getFunds').its('request.url').should('include', 'sortBy=name');
  });

  it('menja smer sortiranja pri drugom kliku', () => {
    interceptFunds();
    cy.get('[data-cy="funds-table"] thead button').contains('Naziv').click();
    cy.wait('@getFunds');
    interceptFunds();
    cy.get('[data-cy="funds-table"] thead button').contains('Naziv').click();
    cy.wait('@getFunds').its('request.url').should('include', 'sortDirection=desc');
  });

  it('sortira po ukupnoj vrednosti', () => {
    interceptFunds();
    cy.get('[data-cy="funds-table"] thead button').contains('Ukupna vrednost').click();
    cy.wait('@getFunds').its('request.url').should('include', 'sortBy=totalValue');
  });

  it('sortira po profitu', () => {
    interceptFunds();
    cy.get('[data-cy="funds-table"] thead button').contains('Profit').click();
    cy.wait('@getFunds').its('request.url').should('include', 'sortBy=profit');
  });

  it('sortira po minimalnom ulogu', () => {
    interceptFunds();
    cy.get('[data-cy="funds-table"] thead button').contains('Minimalni ulog').click();
    cy.wait('@getFunds').its('request.url').should('include', 'sortBy=minimumContribution');
  });

  // ===========================================================
  // Invest modal
  // ===========================================================

  it('otvara modal klikom na "Investiraj"', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.get('[data-cy="invest-modal"]').should('exist');
  });

  it('prikazuje naziv fonda u modalu', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.get('[data-cy="invest-modal"]').should('contain', 'Global Growth Fund');
  });

  it('prikazuje minimalni ulog u modalu', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.get('[data-cy="invest-modal"]').should('contain', '50.000,00');
  });

  it('učitava i prikazuje aktivne račune u select-u', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.wait('@getAccounts');
    cy.get('[data-cy="account-select"] option').should('have.length.gte', 2);
  });

  it('dugme "Investiraj" u modalu je onemogućeno bez iznosa', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.wait('@getAccounts');
    cy.get('[data-cy="confirm-invest-btn"]').should('be.disabled');
  });

  it('prikazuje grešku ako je iznos manji od minimuma', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.wait('@getAccounts');
    cy.get('[data-cy="amount-input"]').type('1000');
    cy.get('[data-cy="invest-modal"]').should('contain', 'Minimalni ulog');
    cy.get('[data-cy="confirm-invest-btn"]').should('be.disabled');
  });

  it('omogućava investiranje sa ispravnim iznosom', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.wait('@getAccounts');
    cy.get('[data-cy="amount-input"]').type('50000');
    cy.get('[data-cy="confirm-invest-btn"]').should('not.be.disabled');
  });

  it('zatvara modal klikom na "Odustani"', () => {
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.get('[data-cy="cancel-invest-btn"]').click();
    cy.get('[data-cy="invest-modal"]').should('not.exist');
  });

  it('šalje POST zahtev pri potvrdi investicije', () => {
    cy.intercept('POST', '**/funds/*/invest', { statusCode: 200 }).as('invest');
    cy.get('[data-cy="invest-btn"]').first().click();
    cy.wait('@getAccounts');
    cy.get('[data-cy="amount-input"]').type('60000');
    cy.get('[data-cy="confirm-invest-btn"]').click();
    cy.wait('@invest').its('request.body').should('include', { amount: 60000 });
    cy.get('[data-cy="invest-modal"]').should('not.exist');
  });

});

// ===========================================================
// Supervizor
// ===========================================================

describe('Fund Discovery — supervizor', () => {

  beforeEach(() => {
    interceptFunds();
    setSupervisorAuth();
    cy.visit('/funds');
    cy.wait('@getFunds');
  });

  it('prikazuje dugme "Kreiraj fond"', () => {
    cy.get('[data-cy="create-fund-btn"]').should('exist').and('contain', 'Kreiraj fond');
  });

  it('ne prikazuje dugme "Investiraj"', () => {
    cy.get('[data-cy="invest-btn"]').should('not.exist');
  });

  it('navigira na /create-fund klikom na "Kreiraj fond"', () => {
    cy.get('[data-cy="create-fund-btn"]').click();
    cy.url().should('include', '/create-fund');
  });

});

// ===========================================================
// Paginacija
// ===========================================================

describe('Fund Discovery — paginacija', () => {

  beforeEach(() => {
    const pagedResponse = {
      content: MOCK_FUNDS,
      totalElements: 25,
      totalPages: 3,
      number: 0,
      size: 10,
    };
    cy.intercept('GET', '**/funds*', { statusCode: 200, body: pagedResponse }).as('getFunds');
    setClientAuth();
    cy.visit('/funds');
    cy.wait('@getFunds');
  });

  it('prikazuje broj rezultata', () => {
    cy.contains('1–10 od 25').should('exist');
  });

  it('dugme za prethodnu stranicu je onemogućeno na prvoj stranici', () => {
    cy.get('button').filter('[disabled]').first().should('exist');
  });

  it('prelazi na sledeću stranicu', () => {
    cy.intercept('GET', '**/funds*', { statusCode: 200, body: { ...MOCK_PAGE, number: 1 } }).as('page2');
    cy.get('button').contains('svg[viewBox]').parents('button').last().click();
    cy.wait('@page2').its('request.url').should('include', 'page=1');
  });

});

// ===========================================================
// Auth guard
// ===========================================================

describe('Fund Discovery — auth guard', () => {

  it('preusmerava na login ako korisnik nije ulogovan', () => {
    clearAuth();
    cy.visit('/funds');
    cy.url().should('include', '/login');
  });

});
