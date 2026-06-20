import { resolverRequestId } from './request-id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('resolverRequestId', () => {
  it('usa o header x-request-id quando presente', () => {
    expect(resolverRequestId({ 'x-request-id': 'req-abc' })).toBe('req-abc');
  });

  it('usa o primeiro valor quando o header vem como array', () => {
    expect(resolverRequestId({ 'x-request-id': ['req-1', 'req-2'] })).toBe('req-1');
  });

  it('gera um UUID quando o header está ausente', () => {
    expect(resolverRequestId({})).toMatch(UUID_RE);
  });

  it('gera um UUID quando o header está vazio/espaços', () => {
    expect(resolverRequestId({ 'x-request-id': '   ' })).toMatch(UUID_RE);
  });

  it('gera ids distintos a cada chamada sem header', () => {
    expect(resolverRequestId({})).not.toBe(resolverRequestId({}));
  });
});
