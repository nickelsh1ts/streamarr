describe('Responsive Design', () => {
  const viewports: [string, number, number][] = [
    ['iPhone SE', 375, 667],
    ['iPhone 14 Pro', 393, 852],
    ['iPad Mini', 768, 1024],
    ['Desktop', 1280, 720],
    ['Wide Desktop', 1920, 1080],
  ];

  describe('Sign In Page', () => {
    viewports.forEach(([device, width, height]) => {
      it(`should render correctly on ${device} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.visit('/signin');
        cy.contains('Sign in to continue').should('be.visible');
      });
    });
  });

  describe('Authenticated Pages', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    viewports.forEach(([device, width, height]) => {
      it(`should render invites page on ${device} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.visit('/invites');
        // Desktop (>=1024px) has visible sidebar, tablet has hamburger
        if (width >= 1024) {
          cy.get('#sidebarMenu').should('be.visible');
        } else if (width >= 640) {
          cy.get('label[aria-label="open sidebar"]').should('be.visible');
        }
      });
    });

    viewports.forEach(([device, width, height]) => {
      it(`should render profile on ${device} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.visit('/profile');
        cy.contains('Total Invites').should('exist');
      });
    });
  });
});
