describe('AccountCreate', () => {
  const route = 'http://localhost:4200/employees/accounts/new';

  function makeFakeJwt(win: Window): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      email: 'tester@example.com',
    };

    const encode = (obj: unknown) =>
      win.btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${encode(header)}.${encode(payload)}.fake-signature`;
  }

  function loginWithClientManage(win: Window): void {
    win.localStorage.setItem('authToken', makeFakeJwt(win));
    win.localStorage.setItem(
      'loggedUser',
      JSON.stringify({
        email: 'tester@example.com',
        role: 'EmployeeBasic',
        permissions: ['CLIENT_MANAGE'],
      })
    );
  }

  beforeEach(() => {
    cy.visit(route, {
      onBeforeLoad(win) {
        loginWithClientManage(win);
      },
    });

    cy.contains('Korak 1 - Tip računa', { timeout: 10000 }).should('be.visible');
  });

  it('DEVIZNI flow sa EUR i poslovnim vlasnikom uspešno šalje formu', () => {
    cy.intercept('POST', '**/accounts*', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 'acc-devizni',
          ...req.body,
        },
      });
    }).as('createAccount');

    // Korak 1
    cy.get('select[formControlName="kind"]').should('be.visible').select('Devizni');

    cy.get('select[formControlName="currency"]')
      .should('be.visible')
      .select('EUR');

    // Na slici se vidi drugi "Tip računa" sa Lični / Poslovni
    // zato uzimamo poslednji select za owner type
    cy.get('select[formControlName="ownerType"], select[formControlName="accountOwnerType"], select')
      .filter(':visible')
      .last()
      .select('Poslovni');

    cy.contains('button', 'Dalje').should('be.enabled').click();

    // Korak 2
    cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

    cy.get('select[formControlName="ownerId"]', { timeout: 10000 })
      .should('be.visible')
      .find('option')
      .then(($options) => {
        expect($options.length).to.be.greaterThan(1);
      });

    cy.get('select[formControlName="ownerId"]').select(1);

    cy.get('input[formControlName="initialBalance"]')
      .should('be.visible')
      .clear()
      .type('2500');

    cy.contains('Podaci o firmi').should('be.visible');

    cy.get('input[formControlName="companyName"]').type('Devizna Firma');
    cy.get('input[formControlName="companyNumber"]').type('54321');
    cy.get('input[formControlName="companyTaxId"]').type('9999');
    cy.get('input[formControlName="companyActivityCode"]').type('777');
    cy.get('input[formControlName="companyAddress"]').type('Beograd 2');

    cy.contains('button', 'Kreiraj račun').should('be.enabled').click();

    cy.wait('@createAccount').its('request.body').should((body) => {
      expect(body.kind).to.exist;
      expect(body.currency).to.equal('EUR');
      expect(body.initialBalance).to.equal(2500);

      expect(body.company).to.deep.equal({
        name: 'Devizna Firma',
        registrationNumber: '54321',
        taxId: '9999',
        activityCode: '777',
        address: 'Beograd 2',
      });

      expect(body.ownerId).to.exist;
    });
  });

  it('prikazuje company polja samo za poslovnog vlasnika', () => {
  cy.visit(route, {
    onBeforeLoad(win) {
      loginWithClientManage(win);
    },
  });

  cy.contains('Korak 1 - Tip računa').should('be.visible');

  cy.get('select[formControlName="kind"]').select('Devizni');
  cy.get('select[formControlName="currency"]').select('EUR');
  cy.get('select').filter(':visible').eq(2).select('Lični');

  cy.contains('button', 'Dalje').click();
  cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

  cy.contains('Podaci o firmi').should('not.exist');

  cy.contains('button', 'Nazad').click();

  cy.get('select[formControlName="kind"]').select('Devizni');
  cy.get('select[formControlName="currency"]').select('EUR');
  cy.get('select').filter(':visible').eq(2).select('Poslovni');

  cy.contains('button', 'Dalje').click();
  cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

  cy.contains('Podaci o firmi').should('be.visible');
  cy.get('input[formControlName="companyName"]').should('be.visible');
});

it('ne dozvoljava devizni račun bez izbora valute', () => {
  cy.visit(route, {
    onBeforeLoad(win) {
      loginWithClientManage(win);
    },
  });

  cy.contains('Korak 1 - Tip računa').should('be.visible');
  cy.get('select[formControlName="kind"]').select('Devizni');

  cy.get('select[formControlName="currency"]').should('be.visible');
  cy.contains('button', 'Dalje').click();

  cy.contains('Korak 2 - Vlasnik').should('not.exist');
});

  it('TEKUCI flow omogućava Novi klijent i vraća korisnika nazad na formu', () => {
    // Korak 1
    cy.get('select[formControlName="kind"]').should('be.visible').select('Tekući');

    // subtype možda postoji tek za tekući račun
    cy.get('body').then(($body) => {
      const subtype = $body.find('select[formControlName="subtype"]');
      if (subtype.length) {
        cy.wrap(subtype).select(1);
      }
    });

    cy.contains('button', 'Dalje').should('be.enabled').click();

    // Korak 2
    cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

    cy.contains('button', 'Novi klijent').should('be.visible').click();

    cy.url({ timeout: 10000 }).should('include', '/users/new');

    // Popuni minimalno što forma traži
    cy.get('body').then(($body) => {
      if ($body.find('input[name="firstName"]').length) {
        cy.get('input[name="firstName"]').type('Test');
      } else if ($body.find('input[formControlName="firstName"]').length) {
        cy.get('input[formControlName="firstName"]').type('Test');
      }

      if ($body.find('input[name="lastName"]').length) {
        cy.get('input[name="lastName"]').type('Klijent');
      } else if ($body.find('input[formControlName="lastName"]').length) {
        cy.get('input[formControlName="lastName"]').type('Klijent');
      }
    });

    cy.contains('button', 'Kreiraj').click();

    cy.url({ timeout: 10000 }).should('include', '/employees/accounts/new');
    cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

    cy.get('select[formControlName="ownerId"]', { timeout: 10000 })
      .should('be.visible')
      .invoke('val')
      .should('not.be.empty');
  });

  it('štiti rutu ako korisnik nije ulogovan', () => {
    cy.visit(route, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });

    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});