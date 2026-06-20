import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { useAuth } from '../../../auth/useAuth';
import { formatDateTime } from '../../../lib/format';
import { useClientes } from '../../clientes/hooks';
import { useItens } from '../../itens/hooks';
import { useTiposTransporte } from '../../tipos-transporte/hooks';
import { AgendamentoSection } from '../components/AgendamentoSection';
import { useAlterarTransporte, useAtualizarStatus, useOrdem } from '../hooks';
import { bloqueioTransicao, proximoStatus, STATUS_LABEL } from '../stateMachine';

export function OrdemDetailPage() {
  const { isOperador } = useAuth();
  const { id } = useParams<{ id: string }>();
  const ordem = useOrdem(id);
  const clientes = useClientes();
  const tipos = useTiposTransporte();
  const itens = useItens();
  const atualizarStatus = useAtualizarStatus();
  const alterarTransporte = useAlterarTransporte();
  const [novoTransporte, setNovoTransporte] = useState('');

  if (ordem.isLoading) return <Spinner />;
  if (ordem.isError || !ordem.data) return <ErrorAlert error={ordem.error} />;

  const o = ordem.data;
  const cliente = clientes.data?.find((c) => c.id === o.clienteId);
  const tipoNome = (tid: string) => tipos.data?.find((t) => t.id === tid)?.nome ?? tid;
  const itemLabel = (iid: string) => {
    const it = itens.data?.find((x) => x.id === iid);
    return it ? `${it.sku} — ${it.descricao}` : iid;
  };

  const proximo = proximoStatus(o.status);
  const bloqueio = bloqueioTransicao(o.status, Boolean(o.agendamento?.confirmado));

  // Transportes autorizados do cliente, para o seletor de alteração.
  const transportesAutorizados = (tipos.data ?? []).filter((t) =>
    cliente?.transportesAutorizados.includes(t.id),
  );

  return (
    <div>
      <div className="spread">
        <h1>
          Ordem <span className="mono">{o.id.slice(0, 8)}</span>
        </h1>
        <Link to="/ordens">← Voltar</Link>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            Status atual: <Badge status={o.status} />
          </div>
          <div className="muted">Criada em {formatDateTime(o.criadoEm)}</div>
          <div className="muted">Atualizada em {formatDateTime(o.atualizadoEm)}</div>
        </div>

        <p>
          <strong>Cliente:</strong> {cliente?.nome ?? o.clienteId}
        </p>
        <p>
          <strong>Transporte:</strong> {tipoNome(o.tipoTransporteId)}
        </p>

        {isOperador && atualizarStatus.isError ? <ErrorAlert error={atualizarStatus.error} /> : null}

        {isOperador ? (
          <div className="row" style={{ marginTop: '0.5rem' }}>
            {proximo ? (
              <Button
                disabled={Boolean(bloqueio) || atualizarStatus.isPending}
                title={bloqueio ?? undefined}
                onClick={() => atualizarStatus.mutate({ id: o.id, status: proximo })}
                data-testid="avancar-status"
              >
                {atualizarStatus.isPending
                  ? 'Avançando...'
                  : `Avançar para ${STATUS_LABEL[proximo]}`}
              </Button>
            ) : (
              <span className="muted">Sem próximas transições (entregue).</span>
            )}
            {bloqueio && proximo ? <span className="muted">{bloqueio}</span> : null}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h2>Itens</h2>
        <Table columns={['Item', 'Quantidade']} isEmpty={o.itens.length === 0}>
          {o.itens.map((it) => (
            <tr key={it.itemId}>
              <td>{itemLabel(it.itemId)}</td>
              <td>{it.quantidade}</td>
            </tr>
          ))}
        </Table>
      </div>

      {isOperador ? (
        <div className="card">
          <h2>Alterar transporte</h2>
          {alterarTransporte.isError ? <ErrorAlert error={alterarTransporte.error} /> : null}
          <div className="row">
            <Select
              aria-label="Novo transporte"
              value={novoTransporte}
              onChange={(e) => setNovoTransporte(e.target.value)}
            >
              <option value="">Selecione...</option>
              {transportesAutorizados.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.codigo})
                </option>
              ))}
            </Select>
            <Button
              disabled={!novoTransporte || alterarTransporte.isPending}
              onClick={() =>
                alterarTransporte.mutate(
                  { id: o.id, tipoTransporteId: novoTransporte },
                  { onSuccess: () => setNovoTransporte('') },
                )
              }
            >
              Alterar
            </Button>
          </div>
          {transportesAutorizados.length === 0 ? (
            <p className="muted">Cliente sem transportes autorizados disponíveis.</p>
          ) : null}
        </div>
      ) : null}

      <AgendamentoSection ordem={o} />
    </div>
  );
}
