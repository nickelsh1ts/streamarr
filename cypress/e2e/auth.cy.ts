describe('Authentication', () => {
  describe('Local Login', () => {
    it('should show the sign-in page', () => {
      cy.visit('/signin');
      cy.contains('Sign in to continue').should('be.visible');
    });

    it('should sign in as admin with valid credentials', () => {
      cy.visit('/signin');

      // Expand the local login accordion first
      cy.get('[data-testid="signin-local-accordion-toggle"]').click();

      cy.env(['ADMIN_EMAIL', 'ADMIN_PASSWORD']).then(
        ({ ADMIN_EMAIL, ADMIN_PASSWORD }) => {
          cy.get('[data-testid="email"]').type(ADMIN_EMAIL);
          cy.get('input[name="password"]').type(ADMIN_PASSWORD);
        }
      );
      cy.get('[data-testid="local-signin-button"]').click();

      // Should redirect to home after login
      cy.url().should('not.include', '/signin');
    });

    it('should reject invalid credentials', () => {
      cy.visit('/signin');

      // Expand the local login accordion first
      cy.get('[data-testid="signin-local-accordion-toggle"]').click();

      cy.get('[data-testid="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('[data-testid="local-signin-button"]').click();

      // Should remain on signin and show error
      cy.url().should('include', '/signin');
    });

    it('should reject empty form submission', () => {
      cy.visit('/signin');

      // Expand the local login accordion first
      cy.get('[data-testid="signin-local-accordion-toggle"]').click();

      cy.get('[data-testid="local-signin-button"]').click();

      // Should remain on signin page
      cy.url().should('include', '/signin');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session after login', () => {
      cy.loginAsAdmin();

      cy.env(['ADMIN_EMAIL']).then(({ ADMIN_EMAIL }) => {
        cy.request('/api/v1/auth/me').then((resp) => {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.have.property('email', ADMIN_EMAIL);
        });
      });
    });

    it('should return current user data from /auth/me', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/auth/me').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('id');
        expect(resp.body).to.have.property('username');
        expect(resp.body).to.have.property('permissions');
      });
    });
  });

  describe('Logout', () => {
    it('should log out and clear session', () => {
      cy.loginAsAdmin();

      cy.request('POST', '/api/v1/auth/logout').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('status', 'ok');
      });

      // Session should be invalid after logout
      cy.request({
        url: '/api/v1/auth/me',
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.be.oneOf([401, 403]);
      });
    });

    it('should render the logout page UI', () => {
      cy.loginAsAdmin();
      cy.visit('/logout');
      // The logout page shows temporary text then redirects
      cy.url().should('not.include', '/logout');
    });
  });

  describe('Access Control', () => {
    it('should deny unauthenticated API requests', () => {
      cy.request({
        url: '/api/v1/user',
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.be.oneOf([401, 403]);
      });
    });

    it('should deny regular user access to admin endpoints', () => {
      cy.loginAsUser();

      cy.request({
        url: '/api/v1/settings/main',
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
    });

    it('should allow admin access to admin endpoints', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/user').then((resp) => {
        expect(resp.status).to.eq(200);
      });
    });
  });
});
