import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { formatDate, formatDateTime } from '../../../lib/format';
import { useClientes } from '../../clientes/hooks';
import { useTiposTransporte } from '../../tipos-transporte/hooks';
import { type FiltrosOrdem } from '../api';
import { useOrdens } from '../hooks';
import { statusOvSchema } from '../schema';
import { STATUS_LABEL } from '../stateMachine';

const STATUS_OPTIONS = statusOvSchema.options;

export function MonitoramentoPage() {
  const [filtros, setFiltros] = useState<FiltrosOrdem>({});
  const ordens = useOrdens(filtros);
  const clientes = useClientes();
  const tipos = useTiposTransporte();

  const clienteNome = (id: string) => clientes.data?.find((c) => c.id === id)?.nome ?? id;
  const tipoNome = (id: string) => tipos.data?.find((t) => t.id === id)?.nome ?? id;

  function update<K extends keyof FiltrosOrdem>(key: K, value: string) {
    setFiltros((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <div>
      <h1>Monitoramento Operacional</h1>

      <div className="card">
        <div className="row">
          <Field label="Status">
            <Select value={filtros.status ?? ''} onChange={(e) => update('status', e.target.value)}>
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cliente">
            <Select value={filtros.clienteId ?? ''} onChange={(e) => update('clienteId', e.target.value)}>
              <option value="">Todos</option>
              {clientes.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de transporte">
            <Select
              value={filtros.tipoTransporteId ?? ''}
              onChange={(e) => update('tipoTransporteId', e.target.value)}
            >
              <option value="">Todos</option>
              {tipos.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Criado de">
            <Input type="date" value={filtros.criadoDe ?? ''} onChange={(e) => update('criadoDe', e.target.value)} />
          </Field>
          <Field label="Criado até">
            <Input type="date" value={filtros.criadoAte ?? ''} onChange={(e) => update('criadoAte', e.target.value)} />
          </Field>
          <Button variant="secondary" onClick={() => setFiltros({})}>
            Limpar filtros
          </Button>
        </div>
      </div>

      <div className="card">
        {ordens.isLoading ? (
          <Spinner />
        ) : ordens.isError ? (
          <ErrorAlert error={ordens.error} />
        ) : (
          <Table
            columns={['ID', 'Cliente', 'Transporte', 'Status', 'Entrega', 'Criado em', '']}
            isEmpty={(ordens.data ?? []).length === 0}
            empty="Nenhuma ordem encontrada para os filtros."
          >
            {ordens.data?.map((o) => (
              <tr key={o.id} data-testid="monitor-row">
                <td className="mono">{o.id.slice(0, 8)}</td>
                <td>{clienteNome(o.clienteId)}</td>
                <td>{tipoNome(o.tipoTransporteId)}</td>
                <td>
                  <Badge status={o.status} />
                </td>
                <td>{o.agendamento ? formatDate(o.agendamento.dataEntrega) : '—'}</td>
                <td>{formatDateTime(o.criadoEm)}</td>
                <td>
                  <Link to={`/ordens/${o.id}`}>Detalhe</Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
