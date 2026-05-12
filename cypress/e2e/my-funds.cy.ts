// cypress/e2e/my-funds.cy.ts
// PR_17 C17.9: E2E testovi za "Moji fondovi" stranicu (PR_14 C14.10 + PR_17 C17.7-C17.8).
//
// Pokriveni flow-ovi:
//   - Stranica ucita pozicije i fund details kroz forkJoin (jedan poziv myPositions
//     + jedan poziv discovery, ne N+1 details poziva)
//   - "Uplati jos" dugme otvara modal (ne window.prompt)
//   - Validacija u modalu: prazan iznos, ispod minimuma, prazan racun
//   - Submit modala salje POST /funds/{id}/invest sa amount + fromAccountNumber
//   - "Povuci" dugme otvara redeem modal sa max=totalInvested validacijom

describe('Moji fondovi (PR_17)', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    // Mock JWT token sa userId za AuthGuard
    window.localStorage.setItem('jwtToken',
      'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3NywicGVybWlzc2lvbnMiOlsiUkVBRCJdfQ.mock');
    window.localStorage.setItem('userId', '77');
    window.localStorage.setItem('role', 'ClientTrading');

    cy.intercept('GET', '**/funds/my-positions', {
      statusCode: 200,
      body: [
        { id: 1, clientId: 77, fundId: 10, totalInvested: 50000,
          firstInvestedAt: '2025-01-01T10:00:00', lastModifiedAt: null },
        { id: 2, clientId: 77, fundId: 20, totalInvested: 20000,
          firstInvestedAt: '2025-02-01T10:00:00', lastModifiedAt: null },
      ],
    }).as('myPositions');

    cy.intercept('GET', '**/funds', {
      statusCode: 200,
      body: [
        { id: 10, naziv: 'Equity Growth Fund', opis: 'Aktivno upravljani equity fond',
          minimumContribution: 1000, managerId: 1, likvidnaSredstva: 100000,
          accountNumber: '1110099900000000010', datumKreiranja: '2024-12-01',
          totalValue: 500000, profit: 25000 },
        { id: 20, naziv: 'Bond Conservative Fund', opis: 'Niska volatilnost',
          minimumContribution: 500, managerId: 1, likvidnaSredstva: 200000,
          accountNumber: '1110099900000000020', datumKreiranja: '2024-12-01',
          totalValue: 800000, profit: -3000 },
      ],
    }).as('funds');
  });

  it('ucita pozicije sa forkJoin (samo 2 poziva, bez N+1)', () => {
    cy.visit('/funds/my');
    cy.wait(['@myPositions', '@funds']);

    // Verifikacija da su SAMO 2 poziva napravljena (ne N+1).
    cy.get('@myPositions.all').should('have.length', 1);
    cy.get('@funds.all').should('have.length', 1);

    // Tabela treba da prikazuje oba reda.
    cy.contains('Equity Growth Fund').should('be.visible');
    cy.contains('Bond Conservative Fund').should('be.visible');
    cy.contains('50,000.00').should('be.visible');
    cy.contains('20,000.00').should('be.visible');
  });

  it('"Uplati jos" otvara modal — ne prompt', () => {
    cy.visit('/funds/my');
    cy.wait(['@myPositions', '@funds']);

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=fund-modal]').should('be.visible');
    cy.contains('Uplata u fond').should('be.visible');
    cy.contains('Equity Growth Fund').should('be.visible');
  });

  it('Validacija: ispod minimuma vraca error u modalu', () => {
    cy.visit('/funds/my');
    cy.wait(['@myPositions', '@funds']);

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('500');  // ispod min 1000
    cy.get('[data-testid=account-input]').type('1110001000000000077');
    cy.get('[data-testid=modal-submit]').click();

    cy.get('[data-testid=modal-error]').should('contain', 'Iznos ispod minimuma');
  });

  it('Validacija: prazan racun vraca error', () => {
    cy.visit('/funds/my');
    cy.wait(['@myPositions', '@funds']);

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('5000');
    cy.get('[data-testid=modal-submit]').click();

    cy.get('[data-testid=modal-error]').should('contain', 'Broj racuna');
  });

  it('Submit invest salje POST /funds/{id}/invest', () => {
    cy.intercept('POST', '**/funds/10/invest', { statusCode: 201, body: {} }).as('invest');
    cy.visit('/funds/my');
    cy.wait(['@myPositions', '@funds']);

    cy.get('[data-testid=invest-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('5000');
    cy.get('[data-testid=account-input]').type('1110001000000000077');
    cy.get('[data-testid=modal-submit]').click();

    cy.wait('@invest').its('request.body').should('deep.equal', {
      amount: 5000,
      fromAccountNumber: '1110001000000000077',
    });
    cy.get('[data-testid=fund-modal]').should('not.exist');
  });

  it('Redeem: iznos veci od ulozenog vraca error', () => {
    cy.visit('/funds/my');
    cy.wait(['@myPositions', '@funds']);

    cy.get('[data-testid=redeem-btn]').first().click();
    cy.get('[data-testid=amount-input]').type('99999');  // veci od 50000
    cy.get('[data-testid=account-input]').type('1110001000000000077');
    cy.get('[data-testid=modal-submit]').click();

    cy.get('[data-testid=modal-error]').should('contain', 'veci od ulozenog');
  });
});
