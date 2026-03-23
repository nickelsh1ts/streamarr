describe('Admin Pages', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  describe('Admin Settings', () => {
    it('should load admin settings page', () => {
      cy.visit('/admin/settings');
      cy.url().should('include', '/admin/settings');
    });

    it('should navigate to general settings', () => {
      cy.visit('/admin/settings/general');
      cy.url().should('include', '/admin/settings/general');
    });

    it('should navigate to plex settings', () => {
      cy.visit('/admin/settings/plex');
      cy.url().should('include', '/admin/settings/plex');
    });

    it('should navigate to system settings', () => {
      cy.visit('/admin/settings/system');
      cy.url().should('include', '/admin/settings/system');
    });

    it('should navigate to logs page', () => {
      cy.visit('/admin/settings/logs');
      cy.url().should('include', '/admin/settings/logs');
    });

    it('should navigate to jobs page', () => {
      cy.visit('/admin/settings/jobs');
      cy.url().should('include', '/admin/settings/jobs');
    });

    it('should navigate to notification settings', () => {
      cy.visit('/admin/settings/notifications');
      cy.url().should('include', '/admin/settings/notifications');
    });
  });

  describe('Service Settings', () => {
    const services = [
      'radarr',
      'sonarr',
      'lidarr',
      'prowlarr',
      'bazarr',
      'tdarr',
      'tautulli',
      'overseerr',
      'downloads',
    ];

    services.forEach((service) => {
      it(`should load ${service} settings page`, () => {
        cy.visit(`/admin/settings/services/${service}`);
        cy.url().should('include', `/admin/settings/services/${service}`);
      });
    });
  });

  describe('User Management', () => {
    it('should load users list page', () => {
      cy.visit('/admin/users');
      cy.url().should('include', '/admin/users');
    });

    it('should display at least 2 seeded users', () => {
      cy.visit('/admin/users');
      // Wait for user list to load via data-testid row selectors
      cy.get('[data-testid="user-list-row"]').should('have.length.at.least', 2);
    });

    it('should have clickable username links', () => {
      cy.visit('/admin/users');
      cy.get('[data-testid="user-list-username-link"]')
        .first()
        .should('exist')
        .and('have.attr', 'href');
    });

    it('should navigate to individual user page', () => {
      cy.visit('/admin/users/1');
      cy.url().should('include', '/admin/users/1');
    });

    it('should navigate to user settings', () => {
      cy.visit('/admin/users/1/settings/general');
      cy.url().should('include', '/admin/users/1/settings/general');
    });

    it('should navigate to user permissions', () => {
      cy.visit('/admin/users/1/settings/permissions');
      cy.url().should('include', '/admin/users/1/settings/permissions');
    });

    it('should navigate to user notification settings', () => {
      cy.visit('/admin/users/1/settings/notifications/email');
      cy.url().should('include', '/admin/users/1/settings/notifications/email');
    });

    it('should display admin nav tabs on desktop', () => {
      cy.visit('/admin/users/1');
      cy.get('[data-testid="Admin-nav-desktop"]').should('exist');
    });
  });

  describe('Admin Access Control', () => {
    // These tests override the admin beforeEach with a regular user login
    it('should redirect non-admin from admin pages', () => {
      cy.loginAsUser();
      cy.visit('/admin/settings', { failOnStatusCode: false });
      // Should be redirected away from admin or shown forbidden
      cy.url().should('not.include', '/admin/settings');
    });

    it('should redirect non-admin from user management', () => {
      cy.loginAsUser();
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin/users');
    });
  });
});
