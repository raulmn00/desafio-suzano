import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { clearSession, getStoredUser, persistSession, type Usuario } from '../lib/storage';

export interface AuthContextValue {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  /** OPERADOR pode escrever (cadastros, OVs, agendamentos); AUDITOR é somente leitura. */
  isOperador: boolean;
  signIn: (token: string, usuario: Usuario) => void;
  signOut: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUser());

  const signIn = useCallback((token: string, u: Usuario) => {
    persistSession(token, u);
    setUsuario(u);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUsuario(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      isAuthenticated: Boolean(usuario),
      isOperador: usuario?.papel === 'OPERADOR',
      signIn,
      signOut,
    }),
    [usuario, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
