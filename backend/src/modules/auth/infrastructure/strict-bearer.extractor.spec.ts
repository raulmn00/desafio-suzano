import { Request } from 'express';
import { extractStrictBearer } from './strict-bearer.extractor';

function req(authorization?: string): Request {
  return { headers: authorization === undefined ? {} : { authorization } } as Request;
}

describe('extractStrictBearer', () => {
  const TOKEN = 'aaa.bbb.ccc';

  it('extrai o token de "Bearer <token>" bem formado', () => {
    expect(extractStrictBearer(req(`Bearer ${TOKEN}`))).toBe(TOKEN);
  });

  it('rejeita esquema minúsculo "bearer" (case-sensitive)', () => {
    expect(extractStrictBearer(req(`bearer ${TOKEN}`))).toBeNull();
  });

  it('rejeita sufixo extra após o token', () => {
    expect(extractStrictBearer(req(`Bearer ${TOKEN} extra`))).toBeNull();
  });

  it('rejeita "Bearer" sem token', () => {
    expect(extractStrictBearer(req('Bearer'))).toBeNull();
  });

  it('rejeita "Bearer " com token vazio', () => {
    expect(extractStrictBearer(req('Bearer '))).toBeNull();
  });

  it('rejeita esquema diferente (Basic)', () => {
    expect(extractStrictBearer(req(`Basic ${TOKEN}`))).toBeNull();
  });

  it('rejeita token cru sem esquema', () => {
    expect(extractStrictBearer(req(TOKEN))).toBeNull();
  });

  it('rejeita ausência do header Authorization', () => {
    expect(extractStrictBearer(req())).toBeNull();
  });

  it('rejeita espaços múltiplos entre esquema e token', () => {
    expect(extractStrictBearer(req(`Bearer  ${TOKEN}`))).toBeNull();
  });
});
