// cypress/e2e/orders-overview.cy.ts
// E2E testovi za Orders Overview komponentu

describe('Orders Overview Component', () => {
  const visitOrdersOverviewAs = (user: {
    email: string;
    role: string;
    permissions: string[];
  }) => {
    cy.visit('/orders-overview', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(user));
      },
    });
  };

  it('ne treba da dozvoli pristup bez ulogovanog korisnika', () => {
    cy.visit('/orders-overview', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
      },
    });

    cy.url().should('include', '/login');
  });

  it('ne treba da dozvoli pristup korisniku bez supervisor permisije', () => {
    visitOrdersOverviewAs({
      email: 'agent@test.com',
      role: 'Agent',
      permissions: [],
    });

    cy.url().should('include', '/403');
  });

  it('ne treba da dozvoli pristup Adminu (samo supervizor na ovom portalu)', () => {
    visitOrdersOverviewAs({
      email: 'admin@test.com',
      role: 'Admin',
      permissions: ['FUND_AGENT_MANAGE'],
    });

    cy.url().should('include', '/403');
  });

  describe('kada je korisnik Supervisor', () => {
    beforeEach(() => {
      cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
        statusCode: 200,
        body: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
        },
      }).as('getOrders');

      visitOrdersOverviewAs({
        email: 'supervisor@test.com',
        role: 'Supervisor',
        permissions: [],
      });
      cy.wait('@getOrders');
    });

    it('treba da prikaže Orders Overview stranicu', () => {
      cy.contains('Orders Overview').should('be.visible');
      cy.contains('Review, approve, decline and cancel trading orders.').should(
        'be.visible',
      );
    });

    it('treba da prikaže filtere za statuse ordera', () => {
      cy.contains('button', 'All').should('be.visible');
      cy.contains('button', 'Pending').should('be.visible');
      cy.contains('button', 'Approved').should('be.visible');
      cy.contains('button', 'Declined').should('be.visible');
      cy.contains('button', 'Done').should('be.visible');
      cy.contains('button', 'Cancelled').should('be.visible');
    });

    it('treba da označi izabrani filter kao aktivan', () => {
      cy.contains('button', 'Pending').click();
      cy.wait('@getOrders');

      cy.contains('button', 'Pending').should('have.class', 'active');
    });

    it('treba da prikaže kolone tabele', () => {
      cy.contains('th', 'Agent').should('be.visible');
      cy.contains('th', 'Order type').should('be.visible');
      cy.contains('th', 'Asset type').should('be.visible');
      cy.contains('th', 'Quantity').should('be.visible');
      cy.contains('th', 'Contract size').should('be.visible');
      cy.contains('th', 'Price per unit').should('be.visible');
      cy.contains('th', 'Direction').should('be.visible');
      cy.contains('th', 'Remaining portions').should('be.visible');
      cy.contains('th', 'Status').should('be.visible');
      cy.contains('th', 'Actions').should('exist');
    });

    it('treba da prikaže empty state kada nema ordera', () => {
      cy.contains('No orders found for selected filter.').should('be.visible');
    });

    it('ne treba da prikaže akcione dugmiće kada nema ordera', () => {
      // Tačan tekst — inače bi 'Approved'/'Declined' filter dugmad poklopila podstring 'Approve'/'Decline'.
      cy.contains('button', /^Approve$/).should('not.exist');
      cy.contains('button', /^Decline$/).should('not.exist');
      cy.contains('button', /^Cancel$/).should('not.exist');
    });

    it('treba da ostane na stranici nakon promene filtera bez ordera', () => {
      cy.contains('button', 'Done').click();
      cy.wait('@getOrders');

      cy.contains('Orders Overview').should('be.visible');
      cy.contains('button', 'Done').should('have.class', 'active');
      cy.contains('No orders found for selected filter.').should('be.visible');
    });
  });
});
