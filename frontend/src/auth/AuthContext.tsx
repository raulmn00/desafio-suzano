import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  persistSession,
  type Usuario,
} from '../lib/storage';
import { logout } from './api';

export interface AuthContextValue {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  /** OPERADOR pode escrever (cadastros, OVs, agendamentos); AUDITOR é somente leitura. */
  isOperador: boolean;
  signIn: (accessToken: string, refreshToken: string, usuario: Usuario) => void;
  signOut: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUser());

  const signIn = useCallback((accessToken: string, refreshToken: string, u: Usuario) => {
    persistSession(accessToken, refreshToken, u);
    setUsuario(u);
  }, []);

  const signOut = useCallback(async () => {
    // Revoga no servidor (access via denylist + refresh) antes de limpar localmente.
    try {
      await logout(getRefreshToken() ?? undefined);
    } catch {
      // sessão pode já estar inválida — segue limpando localmente
    }
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
