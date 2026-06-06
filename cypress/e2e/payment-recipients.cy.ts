const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const MOCK_RECIPIENTS = [
  { id: 1, name: 'Pera Perić', accountNumber: '265000000923124323' },
  { id: 2, name: 'Maja Nikolić', accountNumber: '265000000923124325' }
];

describe('Payment Recipients Component', () => {

  beforeEach(() => {
    // Presretanje dohvatanja računa
    cy.intercept('GET', '**/accounts/client/accounts*', {
      statusCode: 200,
      body: {
        content: [{ accountNumber: '1234567890', type: 'TEKUCI', balance: 1000 }]
      }
    }).as('getAccounts');

    // Presretanje dohvatanja primalaca
    cy.intercept('GET', '**/payments/recipients', {
      statusCode: 200,
      body: { content: MOCK_RECIPIENTS }
    }).as('getRecipients');

    // Presretanje za dodavanje primaoca
    cy.intercept('POST', '**/payments/recipients', {
      statusCode: 201,
      body: { id: 3, name: 'Novi Primalac', accountNumber: '265000000923124326' }
    }).as('addRecipient');

    // Presretanje za brisanje primaoca
    cy.intercept('DELETE', '**/payments/recipients/**', {
      statusCode: 200,
      body: { message: 'Recipient deleted' }
    }).as('deleteRecipient');

    // Presretanje za ažuriranje primaoca
    cy.intercept('PUT', '**/payments/recipients/**', {
      statusCode: 200,
      body: { id: 1, name: 'Ažuriran Primalac', accountNumber: '265000000923124323' }
    }).as('updateRecipient');

    // Autentifikacija
    cy.visit('/payments/recipients', {
      onBeforeLoad(win) {
        win.localStorage.setItem('authToken', TOKEN_77);
        win.localStorage.setItem('loggedUser', JSON.stringify({
          email: 'klijent@test.com',
          role: 'Client',
          permissions: []
        }));
      }
    });

    // Obezbedi da se stranica u potpunosti renderuje
    cy.get('h1, h2, .z-card, table', { timeout: 10000 }).should('exist');
    cy.wait('@getRecipients');
  });

  describe('Prikaz liste i osnovni elementi', () => {
    it('treba da prikaže naslov stranice', () => {
      cy.contains(/PRIMAOCI|Primaoci/i).should('exist');
    });

    it('treba da prikaže dugme DODAJ +', () => {
      cy.contains('button', /DODAJ/i).should('be.visible');
    });

    it('treba da popuni tabelu mock podacima (nazivi i računi)', () => {
      cy.get('table tbody tr').should('have.length.at.least', 2);
      cy.contains('td', 'Pera Perić').should('be.visible');
      cy.contains('td', '265000000923124323').should('be.visible');
      cy.contains('td', 'Maja Nikolić').should('be.visible');
    });

    it('treba da prikaže dugmad Izmeni i Obriši za svakog primaoca', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.contains('button', /Izmeni/i).should('be.visible');
        cy.contains('button', /Obri|Delete/i).should('be.visible');
      });
    });

    it('treba da prikaže paginaciju', () => {
      cy.contains(/Prikazuje se/i).should('be.visible');
    });
  });

  describe('Pretraga', () => {
    it('treba da filtrira primaоce po imenu', () => {
      cy.get('input[type="text"]').first().clear({ force: true }).type('Maja', { force: true });
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('td', 'Maja Nikolić').should('be.visible');
    });

    it('treba da filtrira primaоce po broju računa', () => {
      cy.get('input[type="text"]').first().clear({ force: true }).type('265000000923124323', { force: true });
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('td', 'Pera Perić').should('be.visible');
    });

    it('treba da prikaže praznu listu kada pretraga nema rezultata', () => {
      cy.get('input[type="text"]').first().clear({ force: true }).type('nepostojeci_primalac', { force: true });
      cy.contains(/Nema primaoca|Prazno/i).should('be.visible');
      cy.get('table').should('not.exist');
    });
  });

  describe('Dodavanje primaoca', () => {
    it('treba da otvori i zatvori formu za dodavanje', () => {
      cy.contains('button', /DODAJ/i).click({ force: true });
      cy.contains('h3', 'Dodaj primaoca').should('be.visible');

      cy.contains('button', /Poni/i).click({ force: true });
      cy.contains('Dodaj primaoca').should('not.exist');
    });

    it('treba da prikaže validacione greške za prazna polja', () => {
      cy.contains('button', /DODAJ/i).click({ force: true });
      cy.contains('button', /POTVRDI/i).click({ force: true });
      cy.get('.z-error').should('contain', 'obavezan');
    });

    it('treba da doda novog primaoca lokalno (nema api-ja u komponenti za to jos uvek)', () => {
      cy.contains('button', /DODAJ/i).click({ force: true });
      cy.get('input[placeholder*="Ime primaoca"]').type('Jovan Jovanović', { force: true });
      cy.get('input[placeholder*="265"]').type('123123123123123123', { force: true });
      cy.contains('button', /POTVRDI/i).click({ force: true });

      cy.contains('Dodaj primaoca').should('not.exist');
      cy.contains('td', 'Jovan Jovanović').should('be.visible');
    });
  });

  describe('Izmena primaoca', () => {
    it('treba da prepopuluje formu i sačuva izmene', () => {
      cy.intercept('PUT', '**/transactions/api/payments/**', {
        statusCode: 200,
        body: { id: 1, name: 'Pera Perić Izmenjen', accountNumber: '265000000923124323' }
      }).as('updateRec');

      cy.get('table tbody tr').first().within(() => {
        cy.contains('button', /Izmeni/i).click({ force: true });
      });

      cy.contains('h3', 'Izmeni primaoca').should('be.visible');
      cy.get('input[placeholder*="Ime primaoca"]').should('have.value', 'Pera Perić');

      cy.get('input[placeholder*="Ime primaoca"]').clear({ force: true }).type('Pera Perić Izmenjen', { force: true });
      cy.contains('button', /POTVRDI/i).click({ force: true });

      cy.wait('@updateRec');
      cy.contains('td', 'Pera Perić Izmenjen').should('be.visible');
    });
  });

  describe('Brisanje primaoca', () => {
    it('treba da obriše primaoca iz tabele', () => {
      cy.intercept('DELETE', '**/transactions/api/payments/**', {
        statusCode: 200
      }).as('deleteRec');

      cy.get('table tbody tr').first().within(() => {
        cy.contains('button', /Obri/i).click({ force: true });
      });

      cy.wait('@deleteRec');
      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('td', 'Pera Perić').should('not.exist');
    });
  });

  describe('Auth Guard', () => {
    it('treba da preusmeri na login ako korisnik nije ulogovan', () => {
      cy.visit('/payments/recipients', {
        onBeforeLoad(win) {
          win.localStorage.clear();
        }
      });
      cy.url().should('include', '/login');
    });
  });

});
