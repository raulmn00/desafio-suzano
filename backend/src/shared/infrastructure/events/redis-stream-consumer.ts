import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { EventoDominio } from '../../domain/evento-dominio';
import { STREAM_EVENTOS } from './redis-stream-event-bus';

export const GRUPO_CONSUMIDORES = 'ovgs-consumers';
const TTL_DEDUP_S = 3600; // janela de idempotência (1h)
const OCIOSO_REIVINDICAR_MS = 60_000; // reivindica entregas presas há > 60s
const BLOCO_MS = 5000; // XREADGROUP bloqueia por 5s (reconecta sem ficar ocioso demais)
const LOTE = 50;

/** Subconjunto da API do ioredis usado pelo consumer — facilita o teste. */
export interface ClienteStreamConsumer {
  xgroup(...args: (string | number)[]): Promise<unknown>;
  xreadgroup(...args: (string | number)[]): Promise<unknown>;
  xack(...args: (string | number)[]): Promise<number>;
  xautoclaim(...args: (string | number)[]): Promise<unknown>;
  set(...args: (string | number)[]): Promise<unknown>;
  quit(): Promise<unknown>;
}

interface Entrada {
  id: string;
  data: string;
}

/**
 * Consome os eventos do Redis Stream via consumer group e os redispara nos
 * handlers `@OnEvent` locais (EventEmitter2). Garantias:
 * - **at-least-once** (só dá `XACK` após despachar);
 * - **idempotência** (dedup por id do evento num SET com TTL → não duplica
 *   efeitos como métricas em reentregas/duplicatas);
 * - **resiliência** (`XAUTOCLAIM` reivindica entregas presas de consumidores
 *   mortos).
 *
 * Só roda quando `REDIS_URL` está definido (senão o EventBus é in-process e este
 * consumer fica inerte). Cada instância é um consumidor distinto do grupo, então
 * a carga se distribui entre instâncias do Cloud Run.
 */
@Injectable()
export class RedisStreamConsumer implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamConsumer.name);
  private readonly consumidor = `c-${randomUUID()}`;
  private client: (ClienteStreamConsumer & { disconnect(): void }) | null = null;
  private parando = false;

  constructor(
    private readonly config: ConfigService,
    private readonly emitter: EventEmitter2,
  ) {}

  onApplicationBootstrap(): void {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      return; // sem Redis → EventBus in-process; consumer inerte
    }
    // Conexão dedicada (XREADGROUP bloqueante exige maxRetriesPerRequest=null).
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
    redis.on('error', (e) => this.logger.warn(`Redis(stream): ${e.message}`));
    this.client = redis as unknown as ClienteStreamConsumer & { disconnect(): void };
    void this.iniciar();
  }

  async onModuleDestroy(): Promise<void> {
    this.parando = true;
    this.client?.disconnect();
  }

  private async iniciar(): Promise<void> {
    await this.garantirGrupo();
    void this.loop();
  }

  /** Cria o consumer group (idempotente: ignora BUSYGROUP se já existe). */
  async garantirGrupo(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.xgroup('CREATE', STREAM_EVENTOS, GRUPO_CONSUMIDORES, '$', 'MKSTREAM');
    } catch (erro) {
      if (!String((erro as Error).message).includes('BUSYGROUP')) {
        throw erro;
      }
    }
  }

  private async loop(): Promise<void> {
    while (!this.parando && this.client) {
      try {
        await this.reivindicarPendentes();
        const resposta = await this.client.xreadgroup(
          'GROUP',
          GRUPO_CONSUMIDORES,
          this.consumidor,
          'COUNT',
          LOTE,
          'BLOCK',
          BLOCO_MS,
          'STREAMS',
          STREAM_EVENTOS,
          '>',
        );
        await this.processarEntradas(this.extrairDeLeitura(resposta));
      } catch (erro) {
        if (this.parando) break;
        this.logger.warn(`loop do consumer: ${(erro as Error).message}`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  /** Reivindica entregas presas (consumidor morto) há mais que o limite ocioso. */
  async reivindicarPendentes(): Promise<void> {
    if (!this.client) return;
    const resp = await this.client.xautoclaim(
      STREAM_EVENTOS,
      GRUPO_CONSUMIDORES,
      this.consumidor,
      OCIOSO_REIVINDICAR_MS,
      '0',
      'COUNT',
      LOTE,
    );
    const entradas = this.extrairDeAutoclaim(resp);
    if (entradas.length) {
      await this.processarEntradas(entradas);
    }
  }

  /**
   * Despacha cada entrada para os handlers locais (idempotente) e dá ACK.
   * Devolve quantos eventos NOVOS foram despachados (dedup descartou o resto).
   */
  async processarEntradas(entradas: Entrada[]): Promise<number> {
    if (!this.client) return 0;
    let despachados = 0;
    for (const { id: entryId, data } of entradas) {
      try {
        const evento = JSON.parse(data) as EventoDominio & { id?: string };
        const chave = `${STREAM_EVENTOS}:visto:${evento.id ?? entryId}`;
        const novo = await this.client.set(chave, '1', 'NX', 'EX', TTL_DEDUP_S);
        if (novo) {
          this.emitter.emit(evento.nome, evento);
          despachados++;
        }
        await this.client.xack(STREAM_EVENTOS, GRUPO_CONSUMIDORES, entryId);
      } catch (erro) {
        // sem ACK → fica pendente e será reivindicada/reentregue
        this.logger.warn(`falha na entrada ${entryId}: ${(erro as Error).message}`);
      }
    }
    return despachados;
  }

  /** Normaliza a resposta do XREADGROUP: `[[stream, [[id, campos]]]]`. */
  extrairDeLeitura(resposta: unknown): Entrada[] {
    if (!Array.isArray(resposta)) return [];
    return resposta.flatMap((stream) => this.extrairDeLista((stream as unknown[])?.[1]));
  }

  /** Normaliza a resposta do XAUTOCLAIM: `[cursor, [[id, campos]], deletados?]`. */
  extrairDeAutoclaim(resposta: unknown): Entrada[] {
    if (!Array.isArray(resposta)) return [];
    return this.extrairDeLista(resposta[1]);
  }

  private extrairDeLista(lista: unknown): Entrada[] {
    if (!Array.isArray(lista)) return [];
    const saida: Entrada[] = [];
    for (const item of lista) {
      const par = item as [string, string[]];
      const id = par?.[0];
      const campos = par?.[1];
      if (typeof id !== 'string' || !Array.isArray(campos)) continue;
      const i = campos.indexOf('data');
      if (i >= 0 && typeof campos[i + 1] === 'string') {
        saida.push({ id, data: campos[i + 1] });
      }
    }
    return saida;
  }
}
