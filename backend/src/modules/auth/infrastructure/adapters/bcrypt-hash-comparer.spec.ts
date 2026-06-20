import { hash } from 'bcryptjs';
import { BcryptHashComparer } from './bcrypt-hash-comparer';

describe('BcryptHashComparer', () => {
  const comparer = new BcryptHashComparer();

  it('retorna true quando a senha corresponde ao hash', async () => {
    const senhaHash = await hash('senha123', 8);

    expect(await comparer.comparar('senha123', senhaHash)).toBe(true);
  });

  it('retorna false quando a senha não corresponde', async () => {
    const senhaHash = await hash('senha123', 8);

    expect(await comparer.comparar('errada', senhaHash)).toBe(false);
  });
});
