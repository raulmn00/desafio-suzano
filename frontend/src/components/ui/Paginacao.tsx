import { Button } from './Button';

interface PaginacaoProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

/** Controles de paginação (Anterior/Próxima) com indicador de página. */
export function Paginacao({ page, totalPages, total, onChange }: PaginacaoProps) {
  if (total === 0) return null;
  const ultima = Math.max(1, totalPages);
  return (
    <div
      className="row"
      style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}
    >
      <span className="muted" data-testid="pag-info">
        Página {page} de {ultima} · {total} {total === 1 ? 'item' : 'itens'}
      </span>
      <div className="row" style={{ gap: '0.4rem' }}>
        <Button
          variant="secondary"
          small
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          data-testid="pag-anterior"
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          small
          disabled={page >= ultima}
          onClick={() => onChange(page + 1)}
          data-testid="pag-proxima"
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
