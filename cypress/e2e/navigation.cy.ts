describe('Navigation', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  describe('Sidebar', () => {
    it('should display the desktop sidebar', () => {
      cy.visit('/invites');
      cy.get('#sidebarMenu').should('exist');
    });

    it('should contain core navigation links', () => {
      cy.visit('/invites');
      cy.get('#sidebarMenu').within(() => {
        cy.get('[data-testid="nav-home"]').should('exist');
        cy.get('[data-testid="nav-invites"]').should('exist');
      });
    });

    it('should navigate to invites page', () => {
      cy.visit('/profile');
      cy.get('#sidebarMenu [data-testid="nav-invites"]').click();
      cy.url().should('include', '/invites');
    });

    it('should load the profile page', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');
    });
  });

  describe('Sidebar - Regular User', () => {
    beforeEach(() => {
      cy.loginAsUser();
    });

    it('should display sidebar for regular users', () => {
      cy.visit('/invites');
      cy.get('#sidebarMenu').should('exist');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      // Use tablet viewport where sidebar hamburger is visible (640px-1024px)
      cy.viewport(768, 1024);
    });

    it('should toggle mobile drawer', () => {
      cy.visit('/invites');
      cy.get('label[aria-label="open sidebar"]').should('be.visible').click();
      cy.get('.drawer-side').should('be.visible');
    });

    it('should close mobile drawer via overlay', () => {
      cy.visit('/invites');
      cy.get('label[aria-label="open sidebar"]').should('be.visible').click();
      cy.get('.drawer-side').should('be.visible');
      cy.get('.drawer-overlay').click({ force: true });
      cy.get('.drawer-side').should('not.be.visible');
    });
  });
});
