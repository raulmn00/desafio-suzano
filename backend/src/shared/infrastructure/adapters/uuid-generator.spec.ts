import { UuidGenerator } from './uuid-generator';

describe('UuidGenerator', () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('gera UUID v4 válido', () => {
    const gerador = new UuidGenerator();

    expect(gerador.gerar()).toMatch(UUID_V4);
  });

  it('gera identificadores distintos a cada chamada', () => {
    const gerador = new UuidGenerator();

    expect(gerador.gerar()).not.toBe(gerador.gerar());
  });
});
