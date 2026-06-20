import { formatDateTime } from '../../../lib/format';

type Estado = Record<string, unknown> | null;

const LABELS: Record<string, string> = {
  status: 'Status',
  tipoTransporteId: 'Transporte',
  agendamento: 'Agendamento',
  'agendamento.dataEntrega': 'Entrega',
  'agendamento.janelaInicio': 'Janela início',
  'agendamento.janelaFim': 'Janela fim',
  'agendamento.confirmado': 'Confirmado',
};
const rotulo = (chave: string): string => LABELS[chave] ?? chave;

/** Achata um objeto em pares chave-pontilhada → valor (recursivo, 1 nível de objeto). */
function achatar(obj: Estado, prefixo = ''): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  if (!obj) return saida;
  for (const [k, v] of Object.entries(obj)) {
    const chave = prefixo ? `${prefixo}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(saida, achatar(v as Estado, chave));
    } else {
      saida[chave] = v;
    }
  }
  return saida;
}

/** Formata um valor para exibição: datas, booleanos e UUIDs ficam legíveis. */
function formatarValor(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return formatDateTime(v);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(v)) return `${v.slice(0, 8)}…`;
    return v;
  }
  return String(v);
}

/**
 * Mostra a mudança de estado de forma legível: na criação, lista o estado novo;
 * nas alterações, mostra apenas os campos que mudaram como "antes → depois".
 */
export function EstadoDiff({ antes, depois }: { antes: Estado; depois: Estado }) {
  const fa = achatar(antes);
  const fd = achatar(depois);

  if (!antes) {
    const chaves = Object.keys(fd);
    return (
      <div className="diff">
        <span className="diff-tag novo">Criação</span>
        {chaves.map((k) => (
          <div key={k} className="diff-line">
            <span className="diff-campo">{rotulo(k)}:</span>{' '}
            <span className="diff-novo" title={String(fd[k] ?? '')}>
              {formatarValor(fd[k])}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const chaves = [...new Set([...Object.keys(fa), ...Object.keys(fd)])];
  const mudaram = chaves.filter((k) => formatarValor(fa[k]) !== formatarValor(fd[k]));

  if (mudaram.length === 0) {
    return <span className="muted">Sem alterações de estado.</span>;
  }

  return (
    <div className="diff">
      {mudaram.map((k) => (
        <div key={k} className="diff-line">
          <span className="diff-campo">{rotulo(k)}:</span>{' '}
          <span className="diff-antigo" title={String(fa[k] ?? '')}>
            {formatarValor(fa[k])}
          </span>
          <span className="diff-seta"> → </span>
          <span className="diff-novo" title={String(fd[k] ?? '')}>
            {formatarValor(fd[k])}
          </span>
        </div>
      ))}
    </div>
  );
}
