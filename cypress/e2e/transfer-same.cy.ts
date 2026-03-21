// cypress/e2e/transfer-same.cy.ts
// E2E testovi za F3 - Prenos (ista valuta)

const mockAccounts = [
  {
    id: 1,
    name: 'Tekuci RSD',
    accountNumber: '265000000000123456',
    balance: 250000,
    availableBalance: 245000,
    reservedFunds: 5000,
    currency: 'RSD',
    status: 'ACTIVE',
    subtype: 'STANDARD',
    ownerId: 1,
    ownerName: 'Marko Petrovic',
    employeeId: 100,
    maintenanceFee: 200,
    dailyLimit: 500000,
    monthlyLimit: 5000000,
    dailySpending: 10000,
    monthlySpending: 150000,
    createdAt: '2024-01-15T10:00:00',
    expiryDate: '2029-01-15T10:00:00'
  },
  {
    id: 2,
    name: 'Stedni RSD',
    accountNumber: '265000000000123457',
    balance: 1500000,
    availableBalance: 1500000,
    reservedFunds: 0,
    currency: 'RSD',
    status: 'ACTIVE',
    subtype: 'SAVINGS',
    ownerId: 1,
    ownerName: 'Marko Petrovic',
    employeeId: 100,
    maintenanceFee: 0,
    dailyLimit: 1000000,
    monthlyLimit: 10000000,
    dailySpending: 0,
    monthlySpending: 0,
    createdAt: '2024-03-01T10:00:00',
    expiryDate: '2029-03-01T10:00:00'
  },
  {
    id: 3,
    name: 'Devizni EUR',
    accountNumber: '265000000000654321',
    balance: 5000,
    availableBalance: 4800,
    reservedFunds: 200,
    currency: 'EUR',
    status: 'ACTIVE',
    subtype: 'FOREIGN_PERSONAL',
    ownerId: 1,
    ownerName: 'Marko Petrovic',
    employeeId: 100,
    maintenanceFee: 2,
    dailyLimit: 10000,
    monthlyLimit: 50000,
    dailySpending: 0,
    monthlySpending: 1000,
    createdAt: '2024-02-10T10:00:00',
    expiryDate: '2029-02-10T10:00:00'
  }
];

function setupAuth() {
  cy.window().then(win => {
    win.localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZXhwIjo5OTk5OTk5OTk5fQ.mock');
    win.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'klijent@banka.rs',
      role: 'Client',
      permissions: ['BANKING_BASIC']
    }));
  });
}

function interceptAccounts() {
  cy.intercept('GET', '**/client/accounts', {
    statusCode: 200,
    body: { content: mockAccounts }
  }).as('getAccounts');
}

describe('F3 - Prenos (ista valuta)', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    setupAuth();
    interceptAccounts();
  });

  // ─── Prikaz forme ───────────────────────────────

  describe('Prikaz forme', () => {

    beforeEach(() => {
      cy.visit('/transfers/same');
      cy.wait('@getAccounts');
    });

    it('prikazuje naslov i oba dropdown-a', () => {
      cy.contains('h1', 'Prenos').should('be.visible');
      cy.get('[data-cy=from-account-select]').should('exist');
      cy.get('[data-cy=to-account-select]').should('exist');
      cy.get('[data-cy=amount-input]').should('exist');
      cy.get('[data-cy=continue-btn]').should('exist');
    });

    it('prikazuje sve aktivne račune u "Sa računa" dropdown-u', () => {
      cy.get('[data-cy=from-account-select] option').should('have.length', 4); // 3 accounts + placeholder
    });

    it('filtrira "Na račun" da prikazuje samo račune iste valute', () => {
      // Izaberi RSD račun
      cy.get('[data-cy=from-account-select]').select('1');

      // Na račun treba da prikaže samo drugi RSD račun (id=2)
      cy.get('[data-cy=to-account-select] option').should('have.length', 2); // 1 match + placeholder
      cy.get('[data-cy=to-account-select] option').last().should('contain', 'Stedni RSD');
    });

    it('prikazuje poruku ako nema dva računa iste valute', () => {
      // EUR ima samo jedan račun
      cy.get('[data-cy=from-account-select]').select('3');
      cy.get('[data-cy=no-match-message]').should('be.visible');
      cy.get('[data-cy=no-match-message]').should('contain', 'Nemate dva računa iste valute');
    });
  });

  // ─── Validacija ─────────────────────────────────

  describe('Validacija', () => {

    beforeEach(() => {
      cy.visit('/transfers/same');
      cy.wait('@getAccounts');
    });

    it('onemogućava nastavi dugme dok forma nije popunjena', () => {
      cy.get('[data-cy=continue-btn]').should('be.disabled');
    });

    it('prikazuje grešku za iznos koji prelazi raspoloživo stanje', () => {
      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('2');
      cy.get('[data-cy=amount-input]').type('999999');
      cy.get('[data-cy=continue-btn]').click();

      cy.get('[data-cy=amount-error]').should('be.visible');
      cy.get('[data-cy=amount-error]').should('contain', 'prelazi raspoloživo');
    });
  });

  // ─── Potvrda i izvršavanje ────────────────────

  describe('Potvrda i izvršavanje', () => {

    beforeEach(() => {
      cy.visit('/transfers/same');
      cy.wait('@getAccounts');
    });

    it('prikazuje stranicu potvrde sa ispravnim podacima', () => {
      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('2');
      cy.get('[data-cy=amount-input]').type('5000');
      cy.get('[data-cy=continue-btn]').click();

      cy.get('[data-cy=confirm-section]').should('be.visible');
      cy.get('[data-cy=confirm-section]').should('contain', '265000000000123456');
      cy.get('[data-cy=confirm-section]').should('contain', '265000000000123457');
      cy.get('[data-cy=confirm-section]').should('contain', '5.000');
    });

    it('dugme Nazad vraća na formu', () => {
      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('2');
      cy.get('[data-cy=amount-input]').type('5000');
      cy.get('[data-cy=continue-btn]').click();

      cy.get('[data-cy=confirm-section]').should('be.visible');
      cy.get('[data-cy=back-btn]').click();
      cy.get('[data-cy=transfer-same-form]').should('be.visible');
    });

    it('uspešna potvrda izvršava prenos', () => {
      cy.intercept('POST', '**/transfers/same-currency', {
        statusCode: 200,
        body: {
          id: 1001,
          fromAccountId: 1,
          toAccountId: 2,
          amount: 5000,
          currency: 'RSD',
          finalAmount: 5000,
          status: 'REALIZED',
          timestamp: new Date().toISOString()
        }
      }).as('transferSame');

      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('2');
      cy.get('[data-cy=amount-input]').type('5000');
      cy.get('[data-cy=continue-btn]').click();
      cy.get('[data-cy=confirm-btn]').click();

      cy.wait('@transferSame');
      cy.get('[data-cy=success-section]').should('be.visible');
      cy.get('[data-cy=success-section]').should('contain', 'uspešan');
    });
  });

  // ─── Novi prenos posle uspeha ───────────────────

  describe('Novi prenos', () => {

    it('dugme "Novi prenos" resetuje formu', () => {
      cy.intercept('POST', '**/transfers/same-currency', {
        statusCode: 200,
        body: { id: 1001, status: 'REALIZED' }
      }).as('transferSame');

      cy.visit('/transfers/same');
      cy.wait('@getAccounts');

      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('2');
      cy.get('[data-cy=amount-input]').type('1000');
      cy.get('[data-cy=continue-btn]').click();
      cy.get('[data-cy=confirm-btn]').click();
      cy.wait('@transferSame');

      cy.get('[data-cy=new-transfer-btn]').click();
      cy.get('[data-cy=transfer-same-form]').should('be.visible');
    });
  });
});
