import { ClienteRedis, RedisCache } from './redis-cache';

function clienteMock(): jest.Mocked<ClienteRedis> {
  return {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn(),
  };
}

describe('RedisCache', () => {
  it('get desserializa o JSON armazenado', async () => {
    const client = clienteMock();
    client.get.mockResolvedValue(JSON.stringify([{ a: 1 }]));
    expect(await new RedisCache(client).get('k')).toEqual([{ a: 1 }]);
    expect(client.get).toHaveBeenCalledWith('k');
  });

  it('get devolve null quando a chave não existe', async () => {
    const client = clienteMock();
    client.get.mockResolvedValue(null);
    expect(await new RedisCache(client).get('k')).toBeNull();
  });

  it('set serializa em JSON com TTL em PX (ms)', async () => {
    const client = clienteMock();
    await new RedisCache(client).set('k', { a: 1 }, 5000);
    expect(client.set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'PX', 5000);
  });

  it('del encaminha a remoção', async () => {
    const client = clienteMock();
    await new RedisCache(client).del('k');
    expect(client.del).toHaveBeenCalledWith('k');
  });

  it('degrada graciosamente: falha no Redis vira cache miss (get → null, set/del não lançam)', async () => {
    const client = clienteMock();
    client.get.mockRejectedValue(new Error('ECONNREFUSED'));
    client.set.mockRejectedValue(new Error('down'));
    client.del.mockRejectedValue(new Error('down'));
    const cache = new RedisCache(client);

    await expect(cache.get('k')).resolves.toBeNull();
    await expect(cache.set('k', 1, 1000)).resolves.toBeUndefined();
    await expect(cache.del('k')).resolves.toBeUndefined();
  });

  it('desconectar encerra o cliente', () => {
    const client = clienteMock();
    new RedisCache(client).desconectar();
    expect(client.disconnect).toHaveBeenCalled();
  });
});
