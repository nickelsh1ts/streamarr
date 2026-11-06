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

    it('should show trusted proxy options only with proxy support', () => {
      cy.visit('/admin/settings/network');
      cy.get('#trustProxy').then(($toggle) => {
        if (!$toggle.is(':checked')) {
          cy.wrap($toggle).click();
        }
      });
      cy.get('#trustedProxies\\.localNetworks').should('exist');
      cy.get('#trustedProxies\\.additional').clear().type('example.com').blur();
      cy.contains(
        'Enter IP addresses or CIDR ranges separated by commas'
      ).should('be.visible');
      cy.get('#trustProxy').click();
      cy.get('#trustedProxies\\.localNetworks').should('not.exist');
    });
  });

  describe('Service Settings', () => {
    const services = [
      'radarr',
      'sonarr',
      'lidarr',
      'chaptarr',
      'prowlarr',
      'bazarr',
      'tdarr',
      'nexroll',
      'tautulli',
      'overseerr',
      'downloads',
      'audiobookshelf',
      'shelfmark',
      'calibreweb',
    ];

    services.forEach((service) => {
      it(`should load ${service} settings page`, () => {
        cy.visit(`/admin/settings/services/${service}`);
        cy.url().should('include', `/admin/settings/services/${service}`);
      });
    });

    it('does not render ABS defaults when settings fail to load', () => {
      cy.intercept('GET', '/api/v1/settings/audiobookshelf', {
        statusCode: 502,
        body: { message: 'Unavailable' },
      });
      cy.visit('/admin/settings/services/audiobookshelf');
      cy.contains('Unable to load Audiobookshelf settings.').should(
        'be.visible'
      );
      cy.get('#hostname').should('not.exist');
      cy.get('button[type="submit"]').should('not.exist');
    });

    it('does not render Shelfmark defaults when settings fail to load', () => {
      cy.intercept('GET', '/api/v1/settings/shelfmark', {
        statusCode: 502,
        body: { message: 'Unavailable' },
      });
      cy.visit('/admin/settings/services/shelfmark');
      cy.contains('Unable to load Shelfmark settings.').should('be.visible');
      cy.get('#hostname').should('not.exist');
      cy.get('button[type="submit"]').should('not.exist');
    });

    it('saves ABS permissions and preserves restricted selections when options fail', () => {
      const settings = {
        enabled: true,
        hostname: 'abs.invalid',
        port: 13378,
        useSsl: false,
        urlBase: '/audiobookshelf',
        apiKey: 'test-key',
        defaultUserSettings: {
          permissions: {
            download: false,
            update: false,
            delete: false,
            upload: false,
            accessAllLibraries: false,
            accessAllTags: false,
            accessExplicitContent: false,
          },
          librariesAccessible: ['saved-library'],
          itemTagsSelected: ['family'],
        },
      };
      cy.intercept('GET', '/api/v1/settings/audiobookshelf', settings);
      cy.intercept('GET', '/api/v1/settings/audiobookshelf/options', {
        statusCode: 502,
        body: { message: 'Unavailable' },
      });
      cy.intercept('POST', '/api/v1/settings/audiobookshelf', (request) => {
        request.reply(request.body);
      }).as('saveAbsDefaults');
      cy.visit('/admin/settings/services/audiobookshelf');
      cy.get('#default-download').should('not.be.checked').check();
      cy.get('[role="status"] .border-error').should('be.visible');
      cy.get('#default-libraries').should('be.disabled');
      cy.get('#default-tags').should('be.disabled');
      cy.contains('saved-library').should('be.visible');
      cy.contains('family').should('be.visible');
      cy.get('button[type="submit"]').click();
      cy.wait('@saveAbsDefaults')
        .its('request.body.defaultUserSettings')
        .should('deep.equal', { permissions: { download: true } });
    });

    it('disables ABS selectors when their choices are empty', () => {
      cy.intercept('GET', '/api/v1/settings/audiobookshelf', {
        enabled: true,
        hostname: 'abs.invalid',
        port: 13378,
        useSsl: false,
        urlBase: '/audiobookshelf',
        apiKey: 'test-key',
        defaultUserSettings: {
          permissions: { accessAllLibraries: false, accessAllTags: false },
        },
      });
      cy.intercept('GET', '/api/v1/settings/audiobookshelf/options', {
        delay: 2000,
        body: { libraries: [], tags: [] },
      }).as('emptyAbsOptions');
      cy.visit('/admin/settings/services/audiobookshelf');
      cy.contains('[role="status"]', 'Loading').should('be.visible');
      cy.get('#default-libraries').should('not.exist');
      cy.get('#default-tags').should('not.exist');
      cy.wait('@emptyAbsOptions');
      cy.get('#default-libraries').should('be.disabled');
      cy.get('#default-tags').should('be.disabled');
    });

    it('opens the ABS tags menu upward without extending the page', () => {
      cy.intercept('GET', '/api/v1/settings/audiobookshelf', {
        enabled: true,
        hostname: 'abs.invalid',
        port: 13378,
        useSsl: false,
        urlBase: '/audiobookshelf',
        apiKey: 'test-key',
        defaultUserSettings: { permissions: { accessAllTags: false } },
      });
      cy.intercept('GET', '/api/v1/settings/audiobookshelf/options', {
        libraries: [],
        tags: Array.from({ length: 20 }, (_, index) => `Tag ${index + 1}`),
      });
      cy.visit('/admin/settings/services/audiobookshelf');
      cy.get('#default-tags').should('not.be.disabled');
      cy.scrollTo('bottom');
      let pageHeight = 0;
      cy.document().then((document) => {
        pageHeight = document.documentElement.scrollHeight;
      });
      cy.get('#default-tags').click({ scrollBehavior: false });
      cy.get('.react-select__menu').should(($menu) => {
        const document = $menu[0].ownerDocument;
        const control = document
          .getElementById('default-tags')!
          .closest('.react-select__control')!;
        const menuBounds = $menu[0].getBoundingClientRect();
        expect(menuBounds.bottom).to.be.at.most(
          control.getBoundingClientRect().top + 1
        );
        expect(menuBounds.top).to.be.at.least(0);
        expect(document.documentElement.scrollHeight).to.equal(pageHeight);
      });
    });

    it('refreshes ABS options after the saved connection changes', () => {
      let hostname = 'first-abs.invalid';
      cy.intercept('GET', '/api/v1/settings/audiobookshelf', (request) => {
        request.reply({
          enabled: true,
          hostname,
          port: 13378,
          useSsl: false,
          urlBase: '/audiobookshelf',
          apiKey: 'test-key',
          defaultUserSettings: { permissions: { accessAllLibraries: false } },
        });
      });
      cy.intercept(
        'GET',
        '/api/v1/settings/audiobookshelf/options',
        (request) => {
          request.reply({
            libraries: [
              {
                id: hostname,
                name:
                  hostname === 'first-abs.invalid'
                    ? 'First Library'
                    : 'Second Library',
              },
            ],
            tags: [],
          });
        }
      ).as('absOptions');
      cy.intercept('POST', '/api/v1/settings/audiobookshelf', (request) => {
        hostname = request.body.hostname;
        request.reply(request.body);
      }).as('changeAbsConnection');
      cy.visit('/admin/settings/services/audiobookshelf');
      cy.wait('@absOptions');
      cy.get('#hostname').clear().type('second-abs.invalid');
      cy.get('button[type="submit"]').click();
      cy.wait('@changeAbsConnection')
        .its('request.body')
        .should('not.have.property', 'defaultUserSettings');
      cy.wait('@absOptions');
      cy.get('#default-libraries').click();
      cy.contains('Second Library').should('be.visible');
      cy.contains('First Library').should('not.exist');
    });

    it('saves Shelfmark new-user policies and global requests with one button', () => {
      cy.intercept('GET', '/api/v1/settings/shelfmark', {
        enabled: true,
        hostname: 'shelfmark.invalid',
        port: 8084,
        useSsl: false,
        urlBase: '/shelfmark',
        defaultUserSettings: {
          audiobookPolicy: 'blocked',
        },
      });
      const globalValues = {
        requestsEnabled: true,
        requestsAllowNotes: true,
        requestLimit: 10,
      };
      cy.intercept('GET', '/api/v1/settings/shelfmark/requests', (request) => {
        request.reply({ values: { ...globalValues }, locked: [] });
      });
      cy.intercept('POST', '/api/v1/settings/shelfmark', (request) => {
        Object.assign(globalValues, request.body.globalRequestSettings);
        request.reply(request.body);
      }).as('saveShelfmarkDefaults');
      cy.visit('/admin/settings/services/shelfmark');
      cy.get('#default-ebookPolicy').select('request_book');
      cy.get('#default-audiobookPolicy').select('inherit');
      cy.get('#default-ebookPolicy option[value="download"]').should(
        'have.text',
        'Download'
      );
      cy.get('#default-ebookPolicy option[value="request_release"]').should(
        'have.text',
        'Request Release'
      );
      cy.get('#requestsEnabled')
        .should('have.attr', 'role', 'checkbox')
        .and('have.attr', 'aria-checked', 'true')
        .click();
      cy.get('#default-ebookPolicy').should('not.exist');
      cy.get('#default-audiobookPolicy').should('not.exist');
      cy.get('#requestsAllowNotes').should('not.exist');
      cy.get('#requestLimit').should('not.exist');
      cy.get('#requestsEnabled').click();
      cy.get('#default-ebookPolicy').should('have.value', 'request_book');
      cy.get('#default-audiobookPolicy').should('have.value', 'inherit');
      cy.get('#requestsAllowNotes')
        .should('have.attr', 'aria-checked', 'true')
        .click();
      cy.get('#requestLimit').should('have.value', '10').clear().type('5');
      cy.get('#requestsEnabled').click();
      cy.get('button[type="submit"]').should('have.length', 1);
      cy.get('button[type="submit"]').click();
      cy.wait('@saveShelfmarkDefaults')
        .its('request.body')
        .should((body) => {
          expect(body.defaultUserSettings).to.deep.equal({
            ebookPolicy: 'request_book',
          });
          expect(body.globalRequestSettings).to.deep.equal({
            requestsEnabled: false,
          });
        });
      cy.get('button[type="submit"]').should('not.be.disabled').click();
      cy.wait('@saveShelfmarkDefaults')
        .its('request.body')
        .should((body) => {
          expect(body.globalRequestSettings).to.deep.equal({});
          expect(body).not.to.have.property('defaultUserSettings');
        });
    });

    it('reconciles Shelfmark defaults after a partial save failure', () => {
      let defaultUserSettings = { ebookPolicy: 'blocked' };
      let failGlobalUpdate = true;
      cy.intercept('GET', '/api/v1/settings/shelfmark', (request) => {
        request.reply({
          enabled: true,
          hostname: 'shelfmark.invalid',
          port: 8084,
          urlBase: '/shelfmark',
          defaultUserSettings,
        });
      }).as('shelfmarkSettings');
      cy.intercept('GET', '/api/v1/settings/shelfmark/requests', {
        values: {
          requestsEnabled: true,
          requestsAllowNotes: true,
          requestLimit: 20,
        },
        locked: [],
      });
      cy.intercept('POST', '/api/v1/settings/shelfmark', (request) => {
        if (request.body.defaultUserSettings) {
          defaultUserSettings = request.body.defaultUserSettings;
        }
        if (failGlobalUpdate) {
          failGlobalUpdate = false;
          request.reply({
            statusCode: 502,
            body: { message: 'Global request update failed' },
          });
          return;
        }
        request.reply(request.body);
      }).as('saveShelfmarkSettings');
      cy.visit('/admin/settings/services/shelfmark');
      cy.wait('@shelfmarkSettings');
      cy.get('#default-ebookPolicy').select('download');
      cy.get('#requestsAllowNotes').click();
      cy.get('button[type="submit"]').click();
      cy.wait('@saveShelfmarkSettings')
        .its('response.statusCode')
        .should('equal', 502);
      cy.wait('@shelfmarkSettings');
      cy.get('#default-ebookPolicy').should('have.value', 'download');
      cy.get('#default-ebookPolicy').select('blocked');
      cy.get('button[type="submit"]').click();
      cy.wait('@saveShelfmarkSettings')
        .its('request.body.defaultUserSettings')
        .should('deep.equal', { ebookPolicy: 'blocked' });
    });

    it('can disable requests with an invalid hidden limit', () => {
      cy.intercept('GET', '/api/v1/settings/shelfmark', {
        enabled: true,
        hostname: 'shelfmark.invalid',
        port: 8084,
        urlBase: '/shelfmark',
      });
      cy.intercept('GET', '/api/v1/settings/shelfmark/requests', {
        values: {
          requestsEnabled: true,
          requestsAllowNotes: true,
          requestLimit: 20,
        },
        locked: [],
      });
      cy.intercept('POST', '/api/v1/settings/shelfmark', (request) =>
        request.reply(request.body)
      ).as('disableRequests');
      cy.visit('/admin/settings/services/shelfmark');
      cy.get('#requestLimit').clear().type('0');
      cy.get('#requestsEnabled').click();
      cy.get('#requestLimit').should('not.exist');
      cy.get('button[type="submit"]').should('not.be.disabled').click();
      cy.wait('@disableRequests')
        .its('request.body.globalRequestSettings')
        .should('deep.equal', { requestsEnabled: false });
    });

    it('hides Shelfmark global settings until the connection is saved', () => {
      let hostname = 'first-shelfmark.invalid';
      cy.intercept('GET', '/api/v1/settings/shelfmark', (request) => {
        request.reply({
          enabled: true,
          hostname,
          port: 8084,
          useSsl: false,
          urlBase: '/shelfmark',
        });
      }).as('shelfmarkSettings');
      cy.intercept('GET', '/api/v1/settings/shelfmark/requests', {
        values: {
          requestsEnabled: true,
          requestsAllowNotes: true,
          requestLimit: 20,
        },
        locked: [],
      }).as('shelfmarkRequests');
      cy.intercept('POST', '/api/v1/settings/shelfmark', (request) => {
        hostname = request.body.hostname;
        request.reply(request.body);
      }).as('changeShelfmarkConnection');
      cy.visit('/admin/settings/services/shelfmark');
      cy.wait('@shelfmarkSettings');
      cy.wait('@shelfmarkRequests');
      cy.get('#requestsAllowNotes').click();
      cy.get('#hostname').clear().type('second-shelfmark.invalid');
      cy.get('#requestsEnabled').should('not.exist');
      cy.get('#requestLimit').should('not.exist');
      cy.get('button[type="submit"]').click();
      cy.wait('@changeShelfmarkConnection')
        .its('request.body')
        .should('include', {
          hostname: 'second-shelfmark.invalid',
        })
        .and('deep.include', {
          globalRequestSettings: { requestsAllowNotes: false },
        });
      cy.wait('@shelfmarkSettings');
      cy.wait('@shelfmarkRequests');
      cy.get('#requestsEnabled').should('exist');
    });

    it('requires a request limit while requests are enabled', () => {
      cy.intercept('GET', '/api/v1/settings/shelfmark', {
        enabled: true,
        hostname: 'shelfmark.invalid',
        port: 8084,
        urlBase: '/shelfmark',
      });
      cy.intercept('GET', '/api/v1/settings/shelfmark/requests', {
        values: {
          requestsEnabled: true,
          requestsAllowNotes: true,
          requestLimit: 20,
        },
        locked: [],
      });
      cy.intercept('POST', '/api/v1/settings/shelfmark').as(
        'saveShelfmarkSettings'
      );
      cy.visit('/admin/settings/services/shelfmark');
      cy.get('#requestLimit').clear().blur();
      cy.contains('Enter a whole number between 1 and 1000.').should(
        'be.visible'
      );
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('@saveShelfmarkSettings.all').should('have.length', 0);
    });

    it('shows an initial Shelfmark settings connection failure', () => {
      cy.intercept('GET', '/api/v1/settings/shelfmark', {
        enabled: true,
        hostname: 'shelfmark.invalid',
        port: 8084,
        urlBase: '/shelfmark',
      });
      cy.intercept('GET', '/api/v1/settings/shelfmark/requests', {
        statusCode: 502,
        body: { message: 'Unavailable' },
      });
      cy.visit('/admin/settings/services/shelfmark');
      cy.contains('Shelfmark is currently unavailable...').should('be.visible');
      cy.get('#requestsEnabled').should('not.exist');
      cy.get('#default-ebookPolicy').should('not.exist');
    });

    it('shows Shelfmark provisioning failures as a toast without loading the iframe', () => {
      cy.intercept('GET', '/api/v1/user/*/settings/main', (request) => {
        request.continue((response) => {
          response.body = {
            ...response.body,
            shelfmarkEnabled: true,
            shelfmarkBaseUrl: '/shelfmark',
            shelfmarkNewUserSignIn: true,
          };
        });
      });
      cy.intercept('HEAD', '/shelfmark', { statusCode: 405 });
      cy.intercept('GET', '/shelfmark', {
        statusCode: 502,
        body: {
          message:
            'Shelfmark setup failed. An account may exist but is not linked to Streamarr.',
        },
      }).as('failedShelfmarkProvisioning');
      cy.visit('/bookmark');
      cy.wait('@failedShelfmarkProvisioning');
      cy.contains('h2', 'Shelfmark Unavailable').should('be.visible');
      cy.contains(
        'Unable to connect to Shelfmark. Service is unreachable.'
      ).should('be.visible');
      cy.get('iframe').should('not.exist');
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
