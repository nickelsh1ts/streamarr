describe('Pull To Refresh', () => {
  it('reloads the current page', () => {
    cy.viewport(390, 844);
    cy.visitMobile('/');
    cy.wait(500);
    cy.window().then((w) => (w.beforeReload = true));
    // initially the new property is there
    cy.window().should('have.prop', 'beforeReload', true);

    cy.get('.main').swipe('bottom', [190, 500]);
    cy.wait(200);
    // after reload the property should be gone
    cy.window().should('not.have.prop', 'beforeReload');
  });
});
