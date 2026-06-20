import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { refreshResponseSchema } from '../auth/schema';
import { env } from './env';
import { clearSession, getRefreshToken, getToken, updateTokens } from './storage';

const baseURL = `${env.VITE_API_URL}/api/v1`;

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o Bearer token (access curto) em toda requisição autenticada.
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh com single-flight: 401s concorrentes compartilham uma única renovação.
let renovando: Promise<string | null> | null = null;

async function renovarAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    // axios "cru" (sem interceptors) para evitar recursão de refresh.
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const { accessToken, refreshToken: novoRefresh } = refreshResponseSchema.parse(data);
    updateTokens(accessToken, novoRefresh);
    return accessToken;
  } catch {
    return null;
  }
}

function encerrarSessao(): void {
  clearSession();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const ehLogin = url.includes('/auth/login');
    const ehRefresh = url.includes('/auth/refresh');
    const ehLogout = url.includes('/auth/logout');

    // Access expirado/revogado: tenta renovar uma vez e repete a requisição.
    if (status === 401 && original && !original._retry && !ehLogin && !ehRefresh && !ehLogout) {
      original._retry = true;
      renovando ??= renovarAccessToken().finally(() => {
        renovando = null;
      });
      const novoAccess = await renovando;
      if (novoAccess) {
        original.headers.Authorization = `Bearer ${novoAccess}`;
        return http(original);
      }
      encerrarSessao();
    } else if (status === 401 && !ehLogin) {
      // 401 em rota autenticada após retry (ou no logout): sessão encerrada.
      encerrarSessao();
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
}

/** Extrai a mensagem amigável do envelope de erro da API. */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiError> | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado.';
}
