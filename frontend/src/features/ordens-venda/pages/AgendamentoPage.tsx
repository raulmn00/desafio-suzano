import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { useClientes } from '../../clientes/hooks';
import { AgendamentoSection } from '../components/AgendamentoSection';
import { useOrdens } from '../hooks';

export function AgendamentoPage() {
  const ordens = useOrdens();
  const clientes = useClientes();
  const [selecionada, setSelecionada] = useState('');

  const clienteNome = (id: string) => clientes.data?.find((c) => c.id === id)?.nome ?? id;
  const ordem = ordens.data?.find((o) => o.id === selecionada);

  return (
    <div>
      <h1>Central de Agendamento</h1>

      <div className="card">
        {ordens.isLoading ? (
          <Spinner />
        ) : ordens.isError ? (
          <ErrorAlert error={ordens.error} />
        ) : (
          <Field label="Selecione a ordem de venda">
            <Select value={selecionada} onChange={(e) => setSelecionada(e.target.value)} data-testid="ov-select">
              <option value="">Selecione...</option>
              {ordens.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)} — {clienteNome(o.clienteId)} [{o.status}]
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {ordem ? (
        <>
          <div className="card">
            <div className="row" style={{ alignItems: 'center' }}>
              <div>
                <strong>{clienteNome(ordem.clienteId)}</strong> · <Badge status={ordem.status} />
              </div>
              <Link to={`/ordens/${ordem.id}`}>Abrir detalhe</Link>
            </div>
          </div>
          <AgendamentoSection ordem={ordem} />
        </>
      ) : (
        <p className="muted">Escolha uma ordem para gerenciar o agendamento.</p>
      )}
    </div>
  );
}
