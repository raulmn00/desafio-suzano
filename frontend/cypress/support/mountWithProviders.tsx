import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from '../../src/auth/AuthContext';

/** Monta um componente com Router + React Query + Auth para component tests. */
export function mountWithProviders(node: ReactNode, initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return cy.mount(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>{node}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
