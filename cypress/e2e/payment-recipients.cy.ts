// cypress/e2e/payment-recipients.cy.ts
// E2E testovi za Payment Recipients komponentu

const MOCK_RECIPIENTS = [
  { id: 1, name: 'Pera Perić',   accountNumber: '265000000923124323' },
  { id: 2, name: 'Maja Nikolić', accountNumber: '265000000923124325' }
];

const setAuth = (): void => {
  localStorage.setItem('authToken', 'fake-jwt-token');
  localStorage.setItem('loggedUser', JSON.stringify({
    email: 'klijent@test.com',
    role: 'Client',
    permissions: []
  }));
};

const clearAuth = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('loggedUser');
};

describe('Payment Recipients Component', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/payment-recipients', (req: any) => {
      if (req.headers['accept']?.includes('text/html')) {
        return req.continue();
      }
      req.reply({ statusCode: 200, body: MOCK_RECIPIENTS });
    }).as('getRecipients');

    setAuth();
    cy.visit('/payments/recipients');
    cy.wait('@getRecipients');
  });

  // ===========================================================
  // Prikaz liste
  // ===========================================================

  it('treba da prikaže naslov stranice', () => {
    cy.get('.page-title').should('contain', 'PRIMAOCI PLAĆANJA');
  });

  it('treba da prikaže sve primaоce u tabeli', () => {
    cy.get('.table tbody tr').should('have.length', 2);
  });

  it('treba da prikaže naziv primaoca za svaki red', () => {
    cy.get('.table tbody tr').first().find('.td-name')
      .should('contain', 'Pera Perić');
  });

  it('treba da prikaže broj računa primaoca', () => {
    cy.get('.table tbody tr').first().find('.td-account')
      .should('contain', '265000000923124323');
  });

  it('treba da prikaže dugmad Izmeni i Obriši za svakog primaoca', () => {
    cy.get('.table tbody tr').each(($row: JQuery<HTMLElement>) => {
      cy.wrap($row).find('.btn-edit').should('exist').and('contain', 'Izmeni');
      cy.wrap($row).find('.btn-delete').should('exist').and('contain', 'Obriši');
    });
  });

  it('treba da prikaže dugme DODAJ +', () => {
    cy.get('.btn-add').should('exist').and('contain', 'DODAJ');
  });

  // ===========================================================
  // Pretraga
  // ===========================================================

  it('treba da filtrira primaоce po imenu', () => {
    cy.get('.toolbar__search input').type('Maja');
    cy.get('.table tbody tr').should('have.length', 1);
    cy.get('.table tbody tr').first().find('.td-name')
      .should('contain', 'Maja Nikolić');
  });

  it('treba da filtrira primaоce po broju računa', () => {
    cy.get('.toolbar__search input').type('265000000923124323');
    cy.get('.table tbody tr').should('have.length', 1);
    cy.get('.table tbody tr').first().find('.td-name')
      .should('contain', 'Pera Perić');
  });

  it('treba da prikaže praznu listu kada pretraga nema rezultata', () => {
    cy.get('.toolbar__search input').type('nepostojeci123');
    cy.get('.table').should('not.exist');
    cy.get('.state-box').should('be.visible');
  });

  it('treba da vrati celu listu kada se pretraga obriše', () => {
    cy.get('.toolbar__search input').type('Maja');
    cy.get('.table tbody tr').should('have.length', 1);
    cy.get('.toolbar__search input').clear();
    cy.get('.table tbody tr').should('have.length', 2);
  });

  // ===========================================================
  // Dodavanje primaoca
  // ===========================================================

  it('treba da otvori formu za dodavanje klikom na DODAJ +', () => {
    cy.get('.btn-add').click();
    cy.get('.form-section').should('be.visible');
    cy.get('.form-title').should('contain', 'Dodaj primaoca');
  });

  it('treba da prikaže grešku ako naziv nije unet', () => {
    cy.get('.btn-add').click();
    cy.get('.btn-submit').click();
    cy.get('.error-msg').should('contain', 'Naziv je obavezan');
  });

  it('treba da prikaže grešku ako broj računa nije unet', () => {
    cy.get('.btn-add').click();
    cy.get('input[placeholder="Ime primaoca"]').type('Test Primalac');
    cy.get('.btn-submit').click();
    cy.get('.error-msg').should('contain', 'Broj računa je obavezan');
  });

  it('treba da doda novog primaoca i zatvori formu', () => {
    cy.intercept('POST', '**/payment-recipients', {
      statusCode: 200,
      body: { id: 3, name: 'Novi Primalac', accountNumber: '265000000000000003' }
    }).as('createRecipient');

    cy.get('.btn-add').click();
    cy.get('input[placeholder="Ime primaoca"]').type('Novi Primalac');
    cy.get('input[placeholder="265000000000000000"]').type('265000000000000003');
    cy.get('.btn-submit').click();
    cy.wait('@createRecipient');

    cy.get('.form-section').should('not.exist');
    cy.get('.table tbody tr').should('have.length', 3);
  });

  it('treba da zatvori formu klikom na Poništi', () => {
    cy.get('.btn-add').click();
    cy.get('.form-section').should('be.visible');
    cy.get('.btn-cancel').click();
    cy.get('.form-section').should('not.exist');
  });

  // ===========================================================
  // Izmena primaoca
  // ===========================================================

  it('treba da otvori formu za izmenu klikom na Izmeni', () => {
    cy.get('.table tbody tr').first().find('.btn-edit').click();
    cy.get('.form-section').should('be.visible');
    cy.get('.form-title').should('contain', 'Izmeni primaoca');
  });

  it('treba da prepopuluje formu sa podacima primaoca', () => {
    cy.get('.table tbody tr').first().find('.btn-edit').click();
    cy.get('input[placeholder="Ime primaoca"]').should('have.value', 'Pera Perić');
    cy.get('input[placeholder="265000000000000000"]').should('have.value', '265000000923124323');
  });

  it('treba da sačuva izmene primaoca', () => {
    cy.intercept('PUT', '**/payment-recipients/1', {
      statusCode: 200,
      body: { id: 1, name: 'Pera Perić Izmenjen', accountNumber: '265000000923124323' }
    }).as('updateRecipient');

    cy.get('.table tbody tr').first().find('.btn-edit').click();
    cy.get('input[placeholder="Ime primaoca"]').clear().type('Pera Perić Izmenjen');
    cy.get('.btn-submit').click();
    cy.wait('@updateRecipient');

    cy.get('.form-section').should('not.exist');
    cy.get('.table tbody tr').first().find('.td-name')
      .should('contain', 'Pera Perić Izmenjen');
  });

  // ===========================================================
  // Brisanje primaoca
  // ===========================================================

  it('treba da obriše primaoca klikom na Obriši', () => {
    cy.intercept('DELETE', '**/payment-recipients/1', {
      statusCode: 200
    }).as('deleteRecipient');

    cy.get('.table tbody tr').first().find('.btn-delete').click();
    cy.wait('@deleteRecipient');

    cy.get('.table tbody tr').should('have.length', 1);
    cy.get('.table tbody tr').first().find('.td-name')
      .should('contain', 'Maja Nikolić');
  });

  // ===========================================================
  // Pagination info
  // ===========================================================

  it('treba da prikaže pagination info', () => {
    cy.get('.pagination-info').should('contain', 'Prikazuje se 1 do 2 od 2 stavke');
  });

  // ===========================================================
  // Auth guard
  // ===========================================================

  it('treba da preusmeri na login ako korisnik nije ulogovan', () => {
    clearAuth();
    cy.visit('/payments/recipients');
    cy.url().should('include', '/login');
  });

});
