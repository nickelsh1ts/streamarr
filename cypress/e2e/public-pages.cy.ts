describe('Public Pages', () => {
  describe('Sign In Page', () => {
    it('should load the sign-in page', () => {
      cy.visit('/signin');
      cy.contains('Sign in to continue').should('be.visible');
    });

    it('should display the Plex login option', () => {
      cy.visit('/signin');
      cy.get('[data-testid="plex-login-button"]').should('exist');
    });

    it('should display the local login form when expanded', () => {
      cy.visit('/signin');
      // Expand the local login accordion
      cy.get('[data-testid="signin-local-accordion-toggle"]').click();
      cy.get('[data-testid="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
    });
  });

  describe('Sign Up Page', () => {
    it('should redirect to signin when signup is disabled', () => {
      cy.visit('/signup');
      // With enableSignUp: false, the client redirects to /signin
      cy.url().should('include', '/signin');
    });
  });

  describe('Password Reset Page', () => {
    it('should load the password reset request page', () => {
      cy.visit('/resetpassword');
      cy.url().should('include', '/resetpassword');
    });
  });

  describe('Help Page', () => {
    it('should load the help page', () => {
      cy.visit('/help');
      cy.url().should('include', '/help');
    });
  });
});
