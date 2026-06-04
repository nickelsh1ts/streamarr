/// <reference types="cypress" />

import { io } from 'socket.io-client';

describe('WebSocket', () => {
  it('should connect to socket.io with an authenticated session', () => {
    cy.loginAsAdmin();
    cy.visit('/');

    cy.then(
      () =>
        new Cypress.Promise<void>((resolve, reject) => {
          const socket = io({
            transports: ['websocket'],
            reconnection: false,
            timeout: 10000,
          });

          const timeout = setTimeout(() => {
            socket.close();
            reject(new Error('Timed out connecting to Socket.IO'));
          }, 12000);

          socket.on('connect', () => {
            clearTimeout(timeout);
            socket.close();
            resolve();
          });

          socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            socket.close();
            reject(err);
          });
        })
    );
  });
});
