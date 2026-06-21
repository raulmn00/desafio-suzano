import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Paginacao } from '../../../components/ui/Paginacao';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { formatDateTime } from '../../../lib/format';
import { type FiltrosAuditoria } from '../api';
import { EstadoDiff } from '../components/EstadoDiff';
import { useAuditoria } from '../hooks';

export function AuditoriaPage() {
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({});
  const [page, setPage] = useState(1);
  const query = useAuditoria(filtros, { page, limit: 20 });

  function update<K extends keyof FiltrosAuditoria>(key: K, value: string) {
    setPage(1);
    setFiltros((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <div>
      <h1>Auditoria</h1>

      <div className="card">
        <div className="row">
          <Field label="ID da entidade">
            <Input
              value={filtros.entidadeId ?? ''}
              placeholder="UUID da entidade"
              onChange={(e) => update('entidadeId', e.target.value)}
            />
          </Field>
          <Field label="Ação">
            <Input
              value={filtros.acao ?? ''}
              placeholder="ex.: CRIAR_ORDEM"
              onChange={(e) => update('acao', e.target.value)}
            />
          </Field>
          <Field label="Ocorrido de">
            <Input type="date" value={filtros.ocorridoDe ?? ''} onChange={(e) => update('ocorridoDe', e.target.value)} />
          </Field>
          <Field label="Ocorrido até">
            <Input
              type="date"
              value={filtros.ocorridoAte ?? ''}
              onChange={(e) => update('ocorridoAte', e.target.value)}
            />
          </Field>
          <Button
            variant="secondary"
            onClick={() => {
              setPage(1);
              setFiltros({});
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      <div className="card">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorAlert error={query.error} />
        ) : (
          <>
            <Table
              columns={['Data/hora', 'Ator', 'Ação', 'Entidade', 'Alteração (antes → depois)']}
              isEmpty={(query.data?.data ?? []).length === 0}
              empty="Nenhum evento de auditoria encontrado."
            >
              {query.data?.data.map((ev) => (
                <tr key={ev.id} data-testid="audit-row">
                  <td>{formatDateTime(ev.ocorridoEm)}</td>
                  <td>{ev.ator}</td>
                  <td>
                    <span className="badge neutral">{ev.acao}</span>
                  </td>
                  <td>
                    {ev.entidadeTipo}
                    <br />
                    <span className="mono">{ev.entidadeId.slice(0, 8)}</span>
                  </td>
                  <td>
                    <EstadoDiff antes={ev.estadoAnterior} depois={ev.estadoPosterior} />
                  </td>
                </tr>
              ))}
            </Table>
            {query.data ? (
              <Paginacao
                page={query.data.page}
                totalPages={query.data.totalPages}
                total={query.data.total}
                onChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
