import '@cypress/code-coverage/support';
import { mount } from 'cypress/react';
import '../../src/styles.css';
import './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);
