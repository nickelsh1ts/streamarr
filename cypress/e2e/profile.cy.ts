describe('Profile Page', () => {
  describe('Admin Profile', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('should load the profile page', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');
    });

    it('should display user info', () => {
      cy.visit('/profile');
      cy.get('[data-testid="profile-header"]').should('exist');
      cy.contains('admin').should('exist');
    });

    it('should display invite statistics', () => {
      cy.visit('/profile');
      cy.contains('Total Invites').should('exist');
      cy.contains('Users Invited').should('exist');
    });
  });

  describe('Regular User Profile', () => {
    beforeEach(() => {
      cy.loginAsUser();
    });

    it('should load the profile page for regular user', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');
    });

    it('should display user info for regular user', () => {
      cy.visit('/profile');
      cy.get('[data-testid="profile-header"]').should('exist');
      cy.contains('friend').should('exist');
    });
  });
});
