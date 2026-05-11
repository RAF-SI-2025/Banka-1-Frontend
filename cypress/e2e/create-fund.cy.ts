/// <reference types="cypress" />

const mockSupervisor = {
  id: 77,
  ime: 'Petar',
  prezime: 'Petrovic',
  datumRodjenja: '1990-01-01',
  pol: 'M',
  email: 'petar.petrovic@banka.com',
  brojTelefona: '+38160111222',
  role: 'SUPERVISOR',
  permisije: ['FUND_AGENT_MANAGE'],
};

const fakeSupervisorToken =
  'e30.eyJpZCI6NzcsImV4cCI6NDEwMjQ0NDgwMH0.sig';

const visitWithSupervisorSession = (url: string) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('authToken', fakeSupervisorToken);
      win.localStorage.setItem(
        'loggedUser',
        JSON.stringify({
          email: mockSupervisor.email,
          role: 'Supervisor',
          permissions: ['FUND_AGENT_MANAGE'],
        }),
      );
    },
  });
};

const interceptCreateFundApis = () => {
  cy.intercept('GET', '**/employees/employees*', {
    statusCode: 200,
    body: {
      content: [mockSupervisor],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 500,
    },
  }).as('getEmployees');

  cy.intercept('GET', '**/stock/api/funds*', {
    statusCode: 200,
    body: {
      content: [
        {
          id: 1,
          name: 'Postojeci Fond',
          description: 'Vec kreiran fond',
          minimumContribution: 1000,
          managerId: 77,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 500,
    },
  }).as('getFunds');

  cy.intercept('GET', '**/stock/api/listings/stocks*', {
    statusCode: 200,
    body: {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
    },
  }).as('getStocks');
};

describe('F5 - Create investment fund', () => {
  beforeEach(() => {
    interceptCreateFundApis();
  });

  it('preusmerava neulogovanog korisnika na login', () => {
    cy.visit('/securities/funds/new', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });

    cy.url().should('include', '/login');
  });


  it('validira obavezna polja i minimalni iznos pre submita', () => {
    visitWithSupervisorSession('/securities/funds/new');
    cy.wait(['@getEmployees', '@getFunds']);

    cy.get('[data-cy=fund-name-input]').clear().type('F').blur();
    cy.get('[data-cy=fund-description-input]').clear().type('kratko').blur();
    cy.get('[data-cy=fund-minimum-input]').clear().type('0').blur();

    cy.get('[data-cy=create-fund-submit]').should('be.disabled');
    cy.contains('Naziv mora imati najmanje 3 karaktera.').should('be.visible');
    cy.contains('Opis mora imati najmanje 10 karaktera.').should('be.visible');
    cy.contains('Unesite iznos veći od 0 RSD.').should('be.visible');
  });

  it('prikazuje grešku ako naziv fonda nije jedinstven', () => {
    visitWithSupervisorSession('/securities/funds/new');
    cy.wait(['@getEmployees', '@getFunds']);

    cy.get('[data-cy=fund-name-input]').clear().type('Postojeci Fond');
    cy.get('[data-cy=fund-description-input]')
      .clear()
      .type('Opis dovoljno dug za validaciju forme.');
    cy.get('[data-cy=fund-minimum-input]').clear().type('2500');
    cy.get('[data-cy=create-fund-submit]').click();

    cy.contains('Fond sa ovim nazivom već postoji.').should('be.visible');
  });

  it('kreira novi fond i šalje ispravan payload', () => {
    const fundName = 'Cypress F5 Fund';

    cy.intercept('POST', '**/stock/api/funds', {
      statusCode: 201,
      body: {
        id: 222,
        name: fundName,
        description: 'Automatski e2e fond za proveru forme.',
        minimumContribution: 2500,
        managerId: 77,
        accountNumber: '265-0000000000123-45',
      },
    }).as('createFund');

    visitWithSupervisorSession('/securities/funds/new');
    cy.wait(['@getEmployees', '@getFunds']);

    cy.get('[data-cy=fund-name-input]').clear().type(fundName);
    cy.get('[data-cy=fund-description-input]')
      .clear()
      .type('Automatski e2e fond za proveru forme.');
    cy.get('[data-cy=fund-minimum-input]').clear().type('2500');

    cy.get('[data-cy=create-fund-submit]').should('not.be.disabled').click();

    cy.wait('@createFund').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        name: fundName,
        description: 'Automatski e2e fond za proveru forme.',
        minimumContribution: 2500,
        managerId: 77,
      });
    });

    cy.contains('Investicioni fond je kreiran').should('be.visible');
    cy.url().should('include', '/securities');
  });
});

export {};
