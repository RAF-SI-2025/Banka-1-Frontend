describe('Employee Edit Modal Component', () => {
  
  beforeEach(() => {
    // 1. UČITAVANJE LISTE (Kao u prethodnom testu)
    cy.intercept('GET', '**/employees*', (req) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return req.continue();
      }
      req.reply({
        statusCode: 200,
        body: [
          { 
            id: 1, 
            ime: 'Marko', 
            prezime: 'Marković', 
            email: 'marko@example.com', 
            pozicija: 'Admin', 
            aktivan: true, 
            permisije: ['Create', 'View'] // Dajemo mu početne permisije
          }
        ]
      });
    }).as('getEmployees');

    // 2. PRESRETANJE API POZIVA ZA ČUVANJE (PUT ili PATCH)
    // Kada kliknemo "Save", tvoj servis verovatno šalje podatke nazad na server.
    // Ovde presrećemo taj poziv ka zaposlenom sa ID=1 da bismo ga proverili.
    cy.intercept('PUT', '**/employees/1', { statusCode: 200, body: {} }).as('updateEmployee');

    // 3. ODLAZAK NA STRANICU I OTVARANJE MODALA
    window.localStorage.setItem('token', 'fake-jwt-token');
    cy.visit('/employees');
    cy.wait('@getEmployees');

    // Klikćemo na olovku (btn-edit) u prvom redu tabele da otvorimo modal
    // Ovo se dešava PRE svakog 'it' bloka!
    cy.get('table.figma-table tbody tr').first().find('.btn-edit').click();
  });

  it('treba da prikaže modal i automatski popuni polja starim podacima', () => {
    // Proveravamo da li je modal vidljiv
    cy.get('.modal-overlay').should('be.visible');
    cy.get('.modal-title').should('contain', 'Edit employee');

    // Proveravamo da li su inputi povukli podatke iz mockovanog objekta
    cy.get('input[formControlName="ime"]').should('have.value', 'Marko');
    cy.get('input[formControlName="prezime"]').should('have.value', 'Marković');
    
    // Proveravamo da li su checkbox-evi za permisije čekirani
    cy.contains('label.checkbox-label', 'Create').find('input[type="checkbox"]').should('be.checked');
    cy.contains('label.checkbox-label', 'Delete').find('input[type="checkbox"]').should('not.be.checked');
  });

  it('treba da onemogući dugme Save i prikaže grešku ako je ime obrisano', () => {
    // Brišemo ime iz inputa
    cy.get('input[formControlName="ime"]').clear();
    
    // Kliknemo negde sa strane da bi se aktivirao 'touched' status forme
    cy.get('.modal-title').click();

    // Dugme mora biti disabled
    cy.get('.btn-save').should('be.disabled');
    
    // Poruka o grešci mora biti vidljiva
    cy.get('.error-message').should('be.visible').and('contain', 'Obavezno polje (min 2 karaktera)');
  });

  it('treba da doda novu permisiju (checkbox) i pošalje izmenjene podatke', () => {
    // 1. Menjamo tekst u inputu
    cy.get('input[formControlName="ime"]').clear().type('Marko Izmenjeni');

    // 2. Klikćemo na checkbox za 'Edit' (koji prethodno nije bio čekiran)
    cy.contains('label.checkbox-label', 'Edit').find('input[type="checkbox"]').check();

    // 3. Klikćemo na dugme za čuvanje
    cy.get('.btn-save').should('not.be.disabled').click();

    // 4. KLJUČNI DEO: Proveravamo da li je Angular zaista poslao prave podatke na server!
    cy.wait('@updateEmployee').then((interception) => {
      // Proveravamo šta je otišlo u 'body' HTTP zahteva
      expect(interception.request.body.ime).to.equal('Marko Izmenjeni');
      expect(interception.request.body.permisije).to.include('Edit'); // Sada treba da ima i Edit
    });

    // 5. Modal bi trebalo da se zatvori
    cy.get('.modal-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na Cancel bez čuvanja', () => {
    // Menjamo ime čisto da budemo sigurni da se neće sačuvati
    cy.get('input[formControlName="ime"]').clear().type('Pera');

    // Klikćemo cancel
    cy.get('.btn-cancel').click();

    // Proveravamo da je modal nestao
    cy.get('.modal-overlay').should('not.exist');
  });
});