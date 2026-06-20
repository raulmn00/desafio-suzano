import { defineConfig } from 'cypress';
import registerCodeCoverageTask from '@cypress/code-coverage/task';

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
    setupNodeEvents(on, config) {
      registerCodeCoverageTask(on, config);
      return config;
    },
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      registerCodeCoverageTask(on, config);
      return config;
    },
  },
});
