/**
 * Port de relógio. Abstrai `new Date()` para tornar o tempo determinístico nos
 * testes (use-cases recebem um Clock fake). Implementado por `SystemClock`.
 */
export abstract class Clock {
  abstract agora(): Date;
}
