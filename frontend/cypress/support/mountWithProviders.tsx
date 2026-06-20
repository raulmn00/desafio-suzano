import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from '../../src/auth/AuthContext';
import { clearSession, persistSession, type Papel, type Usuario } from '../../src/lib/storage';

const usuarioFake = (papel: Papel): Usuario => ({
  id: `u-${papel}`,
  email: `${papel.toLowerCase()}@ovgs.dev`,
  nome: `${papel} OVGS`,
  papel,
});

/**
 * Monta um componente com Router + React Query + Auth para component tests.
 * `papel` semeia a sessão (localStorage) antes da montagem, permitindo testar a
 * divisão de UI por papel (OPERADOR × AUDITOR). Sem `papel`, monta anônimo.
 */
export function mountWithProviders(
  node: ReactNode,
  initialEntries: string[] = ['/'],
  papel?: Papel,
) {
  if (papel) {
    persistSession('test-token', usuarioFake(papel));
  } else {
    clearSession();
  }

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
