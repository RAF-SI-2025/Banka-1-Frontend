describe('Employee List Component', () => {
  
  beforeEach(() => {
    // 1. PRESRETANJE API POZIVA (MOCKING)
    // Ne želimo da zavisimo od pravog backend-a. Kad Angular pozove getEmployees(),
    // Cypress će presresti taj poziv i vratiti ove lažne podatke.
    cy.intercept('GET', '**/employees*', (req) => {
      // Propuštamo učitavanje HTML stranice (koristimo uglaste pregrade za 'accept')
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return req.continue();
      }

      // VRAĆAMO ČIST NIZ PODATAKA
      req.reply({
        statusCode: 200,
        body: [
          { id: 1, ime: 'Marko', prezime: 'Marković', email: 'marko@example.com', pozicija: 'Admin', aktivan: true, permisije: ['Create', 'Edit', 'Delete', 'View'] },
          { id: 2, ime: 'Jelena', prezime: 'Jovanović', email: 'jelena@example.com', pozicija: 'Regular', aktivan: false, permisije: ['View'] }
        ]
      });
    }).as('getEmployees');

    // 2. ZAOBILAŽENJE AUTH GUARDA
    // Obično se token čuva u localStorage. Ako tvoj authGuard proverava nešto drugo
    // (npr. sessionStorage ili cookie), prilagodi ovu liniju.
    window.localStorage.setItem('token', 'fake-jwt-token');

    // 3. ODLAZAK NA STRANICU
    cy.visit('/employees');
    
    // Čekamo da se naš lažni API poziv završi pre nego što počnemo testove
    cy.wait('@getEmployees');
  });

  it('treba da prikaže listu zaposlenih u tabeli', () => {
    // Proveravamo da li tabela ima tačno 2 reda (podaci koje smo mock-ovali)
    cy.get('table.figma-table tbody tr').should('have.length', 2);
    
    // Proveravamo da li se ime prvog zaposlenog ispisalo
    cy.get('table.figma-table tbody tr').first().should('contain', 'Marko Marković');
    cy.get('table.figma-table tbody tr').first().should('contain', 'Admin');
  });

  it('treba da filtrira tabelu na osnovu tekstualne pretrage', () => {
    // Kucamo 'jelena' u search input
    cy.get('.search-input').type('jelena');

    // Tabela sada treba da ima samo 1 red
    cy.get('table.figma-table tbody tr').should('have.length', 1);
    cy.get('table.figma-table tbody tr').first().should('contain', 'jelena@example.com');
  });

  it('treba da filtrira tabelu na osnovu statusa (Active/Inactive)', () => {
    // Biramo 'Inactive' iz dropdown-a za status (prvi custom-select)
    cy.get('.dropdown-wrapper').contains('Status').parent().find('select').select('Inactive');

    // Tabela treba da prikaže samo Jelenu (koja je aktivan: false)
    cy.get('table.figma-table tbody tr').should('have.length', 1);
    cy.get('table.figma-table tbody tr').first().should('contain', 'Inactive');
  });

  it('treba da preusmeri na formu za kreiranje kada se klikne na "+ Add employee"', () => {
    cy.get('.btn-add').contains('+ Add employee').click();
    
    // Proveravamo da li se URL promenio
    cy.url().should('include', '/employees/new');
  });

  it('treba da obriše zaposlenog kada se klikne na kantu', () => {
    // Presrećemo DELETE zahtev
    cy.intercept('DELETE', '**/employees/1', { statusCode: 200 }).as('deleteEmployee');

    // Cypress po default-u automatski prihvata window.confirm() prozor.
    // Klikćemo na kantu (btn-delete) u prvom redu
    cy.get('table.figma-table tbody tr').first().find('.btn-delete').click();

    // Proveravamo da li je API pozvan
    cy.wait('@deleteEmployee');

    // U UI-ju bi trebalo da ostane samo jedan zaposleni (Jelena)
    cy.get('table.figma-table tbody tr').should('have.length', 1);
    cy.get('table.figma-table tbody tr').first().should('contain', 'Jelena');
  });

  it('treba da otvori edit modal kada se klikne na olovku', () => {
    // Klikćemo na dugme za edit u prvom redu
    cy.get('table.figma-table tbody tr').first().find('.btn-edit').click();

    // Pošto modal ima selektor <app-employee-edit-modal>, proveravamo da li postoji u DOM-u
    cy.get('app-employee-edit-modal').should('exist');
  });

});