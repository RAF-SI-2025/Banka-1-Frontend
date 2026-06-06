// cypress/e2e/my-funds.cy.ts
// PR_17 C17.9: E2E testovi za "Moji fondovi" stranicu.

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3NywicGVybWlzc2lvbnMiOlsiUkVBRCJdfQ.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['READ'],
};

// Enriched positions — backend embeds fundNaziv directly in the response.
const MOCK_POSITIONS = [
  {
    id: 1, clientId: 77, fundId: 10,
    fundNaziv: 'Equity Growth Fund', fundOpis: 'Aktivno upravljani equity fond',
    fundTotalValue: 500000,
    totalInvested: 50000, currentPositionValue: 52500,
    clientProfit: 2500, percentageOfFund: 0.105,
    firstInvestedAt: '2025-01-01T10:00:00', lastModifiedAt: null,
  },
  {
    id: 2, clientId: 77, fundId: 20,
    fundNaziv: 'Bond Conservative Fund', fundOpis: 'Niska volatilnost',
    fundTotalValue: 800000,
    totalInvested: 20000, currentPositionValue: 19700,
    clientProfit: -300, percentageOfFund: 0.025,
    firstInvestedAt: '2025-02-01T10:00:00', lastModifiedAt: null,
  },
];

describe('Moji fondovi (PR_17)', () => {

  function visitMyFunds() {
    cy.visit('/funds/my-funds', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', TOKEN);
        win.localStorage.setItem('userId', '77');
        win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      }
    });
  }

  beforeEach(() => {
    cy.intercept('GET', '**/funds/my-positions', {
      statusCode: 200,
      body: MOCK_POSITIONS,
    }).as('myPositions');
  });

  it('ucita pozicije (bez N+1)', () => {
    visitMyFunds();
    cy.wait('@myPositions');

    cy.get('@myPositions.all').should('have.length', 1);

    cy.contains('Equity Growth Fund').should('be.visible');
    cy.contains('Bond Conservative Fund').should('be.visible');
    cy.contains('50,000.00').should('be.visible');
    cy.contains('20,000.00').should('be.visible');
  });

  it('"Uplati jos" otvara modal — ne prompt', () => {
    visitMyFunds();
    cy.wait('@myPositions');

    cy.get('[data-testid=invest-btn]').first().click();
    cy.contains('Uplata u fond').should('be.visible');
    cy.contains('Equity Growth Fund').should('be.visible');
  });

  it('Validacija: ispod minimuma vraca error u modalu', () => {
    cy.intercept('POST', '**/funds/10/invest', {
      statusCode: 400,
      body: { message: 'Iznos ispod minimuma' },
    }).as('investFail');

    visitMyFunds();
    cy.wait('@myPositions');

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('500');
    cy.get('[data-testid=account-input]').type('1110001000000000077');
    cy.get('[data-testid=form-modal-confirm]').click();
    cy.wait('@investFail');

    cy.get('[data-testid=form-modal-error]').should('contain', 'Iznos ispod minimuma');
  });

  it('Validacija: prazan racun vraca error', () => {
    visitMyFunds();
    cy.wait('@myPositions');

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('5000');
    cy.get('[data-testid=form-modal-confirm]').click();

    cy.get('[data-testid=form-modal-error]').should('contain', 'Broj racuna');
  });

  it('Submit invest salje POST /funds/{id}/invest', () => {
    cy.intercept('POST', '**/funds/10/invest', { statusCode: 201, body: {} }).as('invest');
    visitMyFunds();
    cy.wait('@myPositions');

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('5000');
    cy.get('[data-testid=account-input]').type('1110001000000000077');
    cy.get('[data-testid=form-modal-confirm]').click();

    cy.wait('@invest').its('request.body').should('deep.equal', {
      amount: 5000,
      fromAccountNumber: '1110001000000000077',
    });
    cy.get('[data-testid=form-modal-overlay]').should('not.exist');
  });

  it('Redeem: iznos veci od trenutne vrednosti vraca error', () => {
    visitMyFunds();
    cy.wait('@myPositions');

    cy.get('[data-testid=redeem-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('99999');
    cy.get('[data-testid=account-input]').type('1110001000000000077');
    cy.get('[data-testid=form-modal-confirm]').click();

    cy.get('[data-testid=form-modal-error]').should('contain', 'veci od trenutne vrednosti');
  });
});
