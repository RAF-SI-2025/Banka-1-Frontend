// cypress/e2e/transfer-diff.cy.ts
// E2E testovi za F4 - Transfer (različite valute)

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
  },
  {
    id: 4,
    name: 'Devizni USD',
    accountNumber: '265000000000654322',
    balance: 3000,
    availableBalance: 3000,
    reservedFunds: 0,
    currency: 'USD',
    status: 'ACTIVE',
    subtype: 'FOREIGN_PERSONAL',
    ownerId: 1,
    ownerName: 'Marko Petrovic',
    employeeId: 100,
    maintenanceFee: 2,
    dailyLimit: 10000,
    monthlyLimit: 50000,
    dailySpending: 0,
    monthlySpending: 0,
    createdAt: '2024-06-01T10:00:00',
    expiryDate: '2029-06-01T10:00:00'
  }
];

const mockPreview = {
  fromAccount: '265000000000123456',
  toAccount: '265000000000654321',
  fromCurrency: 'RSD',
  toCurrency: 'EUR',
  originalAmount: 10000,
  exchangeRate: 117.50,
  commission: 0.43,
  commissionCurrency: 'EUR',
  finalAmount: 84.68,
  ownerName: 'Marko Petrovic'
};

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

function interceptPreview() {
  cy.intercept('POST', '**/transfers/preview', {
    statusCode: 200,
    body: mockPreview
  }).as('previewTransfer');
}

describe('F4 - Transfer (različite valute)', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    setupAuth();
    interceptAccounts();
    interceptPreview();
  });

  // ─── Prikaz forme ───────────────────────────────

  describe('Prikaz forme', () => {

    beforeEach(() => {
      cy.visit('/transfers/different');
      cy.wait('@getAccounts');
    });

    it('prikazuje naslov i formu', () => {
      cy.contains('h1', 'Transfer').should('be.visible');
      cy.get('[data-cy=from-account-select]').should('exist');
      cy.get('[data-cy=to-account-select]').should('exist');
      cy.get('[data-cy=amount-input]').should('exist');
      cy.get('[data-cy=continue-btn]').should('exist');
    });

    it('filtrira "Na račun" da prikazuje samo račune različite valute', () => {
      // Izaberi RSD račun
      cy.get('[data-cy=from-account-select]').select('1');

      // Na račun treba da prikaže EUR i USD (ne drugi RSD)
      cy.get('[data-cy=to-account-select] option').should('have.length', 3); // EUR + USD + placeholder
      cy.get('[data-cy=to-account-select]').should('contain', 'Devizni EUR');
      cy.get('[data-cy=to-account-select]').should('contain', 'Devizni USD');
      cy.get('[data-cy=to-account-select]').should('not.contain', 'Stedni RSD');
    });

    it('ažurira odredišne račune kada se promeni izvorni račun', () => {
      // Izaberi EUR račun
      cy.get('[data-cy=from-account-select]').select('3');

      // Odredišni treba da ima RSD i USD račune (ne EUR)
      cy.get('[data-cy=to-account-select]').should('contain', 'Tekuci RSD');
      cy.get('[data-cy=to-account-select]').should('contain', 'Devizni USD');
      cy.get('[data-cy=to-account-select]').should('not.contain', 'Devizni EUR');
    });
  });

  // ─── Validacija ─────────────────────────────────

  describe('Validacija', () => {

    beforeEach(() => {
      cy.visit('/transfers/different');
      cy.wait('@getAccounts');
    });

    it('onemogućava nastavi dugme dok forma nije popunjena', () => {
      cy.get('[data-cy=continue-btn]').should('be.disabled');
    });

    it('prikazuje grešku za iznos koji prelazi raspoloživo stanje', () => {
      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('3');
      cy.get('[data-cy=amount-input]').type('999999');
      cy.get('[data-cy=continue-btn]').click();

      cy.get('[data-cy=amount-error]').should('be.visible');
      cy.get('[data-cy=amount-error]').should('contain', 'prelazi raspoloživo');
    });
  });

  // ─── Stranica potvrde sa detaljima konverzije ───

  describe('Stranica potvrde', () => {

    beforeEach(() => {
      cy.visit('/transfers/different');
      cy.wait('@getAccounts');

      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('3');
      cy.get('[data-cy=amount-input]').type('10000');
      cy.get('[data-cy=continue-btn]').click();
      cy.wait('@previewTransfer');
    });

    it('prikazuje ime i prezime klijenta', () => {
      cy.get('[data-cy=preview-owner]').should('contain', 'Marko Petrovic');
    });

    it('prikazuje brojeve oba računa', () => {
      cy.get('[data-cy=preview-from]').should('contain', '265000000000123456');
      cy.get('[data-cy=preview-to]').should('contain', '265000000000654321');
    });

    it('prikazuje početni iznos sa valutom', () => {
      cy.get('[data-cy=preview-amount]').should('contain', '10.000');
      cy.get('[data-cy=preview-amount]').should('contain', 'RSD');
    });

    it('prikazuje kurs konverzije', () => {
      cy.get('[data-cy=preview-rate]').should('contain', '117.5');
    });

    it('prikazuje iznos provizije', () => {
      cy.get('[data-cy=preview-commission]').should('be.visible');
    });

    it('prikazuje krajnji iznos u odredišnoj valuti', () => {
      cy.get('[data-cy=preview-final]').should('contain', '€');
    });

    it('dugme Nazad vraća na formu', () => {
      cy.get('[data-cy=back-btn]').click();
      cy.get('[data-cy=transfer-diff-form]').should('be.visible');
    });
  });

  // ─── Izvršavanje transfera ────────────────────

  describe('Izvršavanje transfera', () => {

    beforeEach(() => {
      cy.visit('/transfers/different');
      cy.wait('@getAccounts');
    });

    it('uspešna potvrda izvršava transfer', () => {
      cy.intercept('POST', '**/transfers/different-currency', {
        statusCode: 200,
        body: {
          id: 1002,
          fromAccountId: 1,
          toAccountId: 3,
          amount: 10000,
          currency: 'RSD',
          finalAmount: 84.68,
          finalCurrency: 'EUR',
          exchangeRate: 117.50,
          commission: 0.43,
          status: 'REALIZED',
          timestamp: new Date().toISOString()
        }
      }).as('transferDiff');

      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('3');
      cy.get('[data-cy=amount-input]').type('10000');
      cy.get('[data-cy=continue-btn]').click();
      cy.wait('@previewTransfer');

      cy.get('[data-cy=confirm-btn]').click();

      cy.wait('@transferDiff');
      cy.get('[data-cy=success-section]').should('be.visible');
      cy.get('[data-cy=success-section]').should('contain', 'uspešan');
    });
  });

  // ─── Novi transfer posle uspeha ─────────────────

  describe('Novi transfer', () => {

    it('dugme "Novi transfer" resetuje formu', () => {
      cy.intercept('POST', '**/transfers/different-currency', {
        statusCode: 200,
        body: { id: 1002, status: 'REALIZED' }
      }).as('transferDiff');

      cy.visit('/transfers/different');
      cy.wait('@getAccounts');

      cy.get('[data-cy=from-account-select]').select('1');
      cy.get('[data-cy=to-account-select]').select('3');
      cy.get('[data-cy=amount-input]').type('10000');
      cy.get('[data-cy=continue-btn]').click();
      cy.wait('@previewTransfer');

      cy.get('[data-cy=confirm-btn]').click();
      cy.wait('@transferDiff');

      cy.get('[data-cy=new-transfer-btn]').click();
      cy.get('[data-cy=transfer-diff-form]').should('be.visible');
    });
  });
});
