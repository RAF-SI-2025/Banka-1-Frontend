// cypress/e2e/home.cy.ts
// E2E testovi za Home stranu (početna strana klijenta)
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

describe('Home E2E', () => {

  beforeEach(() => {
    cy.clearLocalStorage();

    // Postavi autentifikovan state
    cy.window().then(win => {
      win.localStorage.setItem('authToken', mockToken);
      win.localStorage.setItem('loggedUser', JSON.stringify({
        email: 'klijent@test.com',
        role: 'Client',
        permissions: []
      }));
    });

    // Interceptuj API za račune
    cy.intercept('GET', '**/accounts/my', {
      statusCode: 200,
      body: mockAccounts
    }).as('getAccounts');

    cy.visit('/home');
    cy.wait('@getAccounts');
  });

  // ─────────────────────────────────────────────
  // NAVIGACIONI MENI
  // ─────────────────────────────────────────────

  describe('Navigacioni meni', () => {

    it('treba da prikaže sve navigacione linkove', () => {
      cy.contains('Računi').should('exist');
      cy.contains('Plaćanja').should('exist');
      cy.contains('Transferi').should('exist');
      cy.contains('Menjačnica').should('exist');
      cy.contains('Kartice').should('exist');
      cy.contains('Krediti').should('exist');
    });

    it('linkovi treba da imaju ispravne rute', () => {
      cy.get('a[href="/accounts"]').should('exist');
      cy.get('a[href="/payments"]').should('exist');
      cy.get('a[href="/transfers"]').should('exist');
      cy.get('a[href="/exchange"]').should('exist');
      cy.get('a[href="/cards"]').should('exist');
      cy.get('a[href="/loans"]').should('exist');
    });

  });

  // ─────────────────────────────────────────────
  // ZAGLAVLJE
  // ─────────────────────────────────────────────

  describe('Zaglavlje', () => {

    it('treba da prikaže dugme Odjava', () => {
      cy.contains('Odjava').should('exist');
    });

    it('klik na Odjava briše token iz localStorage', () => {
      cy.contains('Odjava').click();

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
        expect(win.localStorage.getItem('loggedUser')).to.be.null;
      });
    });

    it('klik na Odjava preusmerava na /login', () => {
      cy.contains('Odjava').click();
      cy.url().should('include', '/login');
    });

  });

  // ─────────────────────────────────────────────
  // PREGLED RAČUNA
  // ─────────────────────────────────────────────

  describe('Pregled računa', () => {

    it('treba da prikaže sekciju RASPOLOŽIVO STANJE', () => {
      cy.contains('RASPOLOŽIVO STANJE').should('exist');
    });

    it('treba da prikaže ukupno raspoloživo stanje', () => {
      // 178000 + 4850 = 182850
      cy.contains('182.850').should('exist');
    });

    it('treba da prikaže sekciju RAČUNI', () => {
      cy.contains('RAČUNI').should('exist');
    });

    it('treba da prikaže naziv i broj tekućeg računa', () => {
      cy.contains('Tekući račun').should('exist');
      cy.contains('265000000000123456').should('exist');
    });

    it('treba da prikaže naziv i broj deviznog računa', () => {
      cy.contains('Devizni račun').should('exist');
      cy.contains('265000000000654321').should('exist');
    });

    it('treba da prikaže raspoloživo stanje tekućeg računa u RSD', () => {
      cy.contains('178.000').should('exist');
    });

    it('treba da prikaže raspoloživo stanje deviznog računa u EUR', () => {
      cy.contains('4.850').should('exist');
      cy.contains('EUR').should('exist');
    });

    it('treba da prikaže poruku kada nema računa', () => {
      cy.intercept('GET', '**/accounts/my', {
        statusCode: 200,
        body: []
      }).as('getEmptyAccounts');

      cy.visit('/home', {
        onBeforeLoad(win) {
          win.localStorage.setItem('authToken', mockToken);
          win.localStorage.setItem('loggedUser', JSON.stringify({
            email: 'klijent@test.com', role: 'Client', permissions: []
          }));
        }
      });
      cy.wait('@getEmptyAccounts');

      cy.contains('Nema aktivnih računa').should('exist');
    });

    it('treba da prikaže error poruku kada API vrati grešku', () => {
      cy.intercept('GET', '**/accounts/my', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getAccountsError');

      cy.visit('/home', {
        onBeforeLoad(win) {
          win.localStorage.setItem('authToken', mockToken);
          win.localStorage.setItem('loggedUser', JSON.stringify({
            email: 'klijent@test.com', role: 'Client', permissions: []
          }));
        }
      });
      cy.wait('@getAccountsError');

      cy.contains('Greška pri učitavanju računa').should('exist');
    });

  });

  // ─────────────────────────────────────────────
  // PLACEHOLDER SEKCIJE
  // ─────────────────────────────────────────────

  describe('Placeholder sekcije', () => {

    it('treba da prikaže sekciju PREGLED TRANSAKCIJA', () => {
      cy.contains('PREGLED TRANSAKCIJA').should('exist');
    });

    it('treba da prikaže placeholder za transakcije', () => {
      cy.contains('Poslednje transakcije').should('exist');
    });

    it('treba da prikaže sekciju BRZO PLAĆANJE', () => {
      cy.contains('BRZO PLAĆANJE').should('exist');
    });

    it('treba da prikaže placeholder za brzo plaćanje', () => {
      cy.contains('Brzo plaćanje').should('exist');
    });

    it('treba da prikaže sekciju MENJAČNICA', () => {
      cy.contains('MENJAČNICA').should('exist');
    });

    it('treba da prikaže placeholder za menjačnicu', () => {
      cy.contains('Kalkulator menjačnice').should('exist');
    });

  });

  // ─────────────────────────────────────────────
  // AUTH GUARD
  // ─────────────────────────────────────────────

  describe('Auth guard', () => {

    it('neautentifikovan korisnik se preusmerava sa /home na /login', () => {
      cy.clearLocalStorage();
      cy.visit('/home');
      cy.url().should('include', '/login');
    });

  });

});
