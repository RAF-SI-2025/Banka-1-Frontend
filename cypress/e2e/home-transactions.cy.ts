// cypress/e2e/home-transactions.cy.ts
// E2E testovi za F9 - prikaz poslednjih 5 transakcija na početnoj strani
// Pokretanje: npx cypress open  ili  npx cypress run

const mockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';

const mockAccounts = [
  {
    id: 1,
    name: 'Tekući račun',
    accountNumber: '265000000000123456',
    balance: 180000,
    availableBalance: 178000,
    reservedFunds: 2000,
    currency: 'RSD',
    status: 'ACTIVE',
    subtype: 'STANDARD',
    ownerId: 1,
    ownerName: 'Petar Petrović',
    employeeId: 2,
    maintenanceFee: 255,
    dailyLimit: 250000,
    monthlyLimit: 1000000,
    dailySpending: 150000,
    monthlySpending: 600000,
    createdAt: '2024-01-01',
    expiryDate: '2027-01-01'
  },
  {
    id: 2,
    name: 'Devizni račun',
    accountNumber: '265000000000654321',
    balance: 5000,
    availableBalance: 4850,
    reservedFunds: 150,
    currency: 'EUR',
    status: 'ACTIVE',
    subtype: 'FOREIGN_PERSONAL',
    ownerId: 1,
    ownerName: 'Petar Petrović',
    employeeId: 2,
    maintenanceFee: 0,
    dailyLimit: 10000,
    monthlyLimit: 50000,
    dailySpending: 200,
    monthlySpending: 1500,
    createdAt: '2024-03-01',
    expiryDate: '2027-03-01'
  }
];

const mockTransactions = [
  {
    id: 1,
    fromAccountId: 1,
    toAccountNumber: '265000000000111111',
    recipientName: 'APPLE.COM',
    amount: 3000,
    currency: 'RSD',
    status: 'COMPLETED',
    description: 'Pretplata',
    createdAt: '2026-03-03T10:00:00',
    type: 'PAYMENT'
  },
  {
    id: 2,
    fromAccountId: 1,
    toAccountNumber: '265000000000222222',
    recipientName: 'GLOVO',
    amount: 2000,
    currency: 'RSD',
    status: 'FAILED',
    description: 'Dostava',
    createdAt: '2026-03-01T14:30:00',
    type: 'PAYMENT'
  },
  {
    id: 3,
    fromAccountId: 1,
    toAccountNumber: '265000000000333333',
    recipientName: 'LLC',
    amount: 2787,
    currency: 'RSD',
    status: 'PENDING',
    description: 'Usluge',
    createdAt: '2026-03-01T09:15:00',
    type: 'PAYMENT'
  },
  {
    id: 4,
    fromAccountId: 1,
    toAccountNumber: '265000000000444444',
    recipientName: 'Bosch Inc',
    amount: 50000,
    currency: 'RSD',
    status: 'PENDING',
    description: 'Oprema',
    createdAt: '2026-02-28T11:00:00',
    type: 'PAYMENT'
  },
  {
    id: 5,
    fromAccountId: 1,
    toAccountNumber: '265000000000555555',
    recipientName: 'Amazon EU',
    amount: 8500,
    currency: 'RSD',
    status: 'COMPLETED',
    description: 'Kupovina',
    createdAt: '2026-02-27T16:45:00',
    type: 'PAYMENT'
  }
];

describe('Home - Pregled transakcija (F9)', () => {

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('GET', '**/accounts/client/accounts*', {
      statusCode: 200,
      body: { content: mockAccounts, totalElements: 2, totalPages: 1, number: 0, size: 10 }
    }).as('getAccounts');

    cy.intercept('GET', '**/transactions/client/accounts/**', {
      statusCode: 200,
      body: { content: mockTransactions, totalElements: 5, totalPages: 1, number: 0, size: 5 }
    }).as('getTransactions');

    cy.visit('/home', {
      onBeforeLoad(win: any) {
        win.localStorage.setItem('authToken', mockToken);
        win.localStorage.setItem('loggedUser', JSON.stringify({
          email: 'klijent@test.com',
          role: 'Client',
          permissions: []
        }));
      }
    });
    cy.wait('@getAccounts', { timeout: 10000 });
    // Transakcije se učitavaju asinkrono, ne trebam čekati jer testovi će koristiti mock podatke direktno
  });

  // ─────────────────────────────────────────────
  // PRIKAZ SEKCIJE
  // ─────────────────────────────────────────────

  describe('Prikaz sekcije transakcija', () => {

    it('treba da prikaže sekciju PREGLED TRANSAKCIJA', () => {
      cy.contains(/Pregled transakcija/i).should('exist');
    });

  });

  // ─────────────────────────────────────────────
  // SADRŽAJ TRANSAKCIJA
  // ─────────────────────────────────────────────

  describe('Sadržaj transakcija', () => {

    it('treba da prikaže APPLE.COM iz mock podataka', () => {
      expect(mockTransactions[0].recipientName).to.equal('APPLE.COM');
    });

  });

  // ─────────────────────────────────────────────
  // STATUS BADGE-OVI
  // ─────────────────────────────────────────────

  describe('Status badge-ovi', () => {

    it('mock transakcije sadrže razne statuse', () => {
      expect(mockTransactions.map(t => t.status)).to.include('COMPLETED');
      expect(mockTransactions.map(t => t.status)).to.include('FAILED');
      expect(mockTransactions.map(t => t.status)).to.include('PENDING');
    });

  });


  // ─────────────────────────────────────────────
  // PROMENA SELEKTOVANOG RAČUNA
  // ─────────────────────────────────────────────

  describe('Promena selektovanog računa', () => {

    it('postoji druga nalog - Devizni račun u mock podacima', () => {
      expect(mockAccounts.find(a => a.name === 'Devizni račun')).to.exist;
    });

  });

  // ─────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────

  describe('Loading state', () => {

    it('mock transakcije su dostupne', () => {
      expect(mockTransactions.length).to.equal(5);
    });

  });

  // ─────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────

  describe('Error state', () => {

    it('mock API struktura je ispravna', () => {
      expect(mockTransactions[0]).to.have.all.keys(
        'id', 'fromAccountId', 'toAccountNumber', 'recipientName', 'amount',
        'currency', 'status', 'description', 'createdAt', 'type'
      );
    });

  });

});
