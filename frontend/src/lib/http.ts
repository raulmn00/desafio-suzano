import axios, { AxiosError } from 'axios';
import { env } from './env';
import { clearSession, getToken } from './storage';

export const http = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o Bearer token em toda requisição autenticada.
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Em 401, limpa a sessão e redireciona para o login.
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Um 401 vindo do próprio login é credencial inválida: deixe a tela tratar
    // (mostrar mensagem) sem disparar o logout/redirect global.
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
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
