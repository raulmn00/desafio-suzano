import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { useTiposTransporte } from '../../tipos-transporte/hooks';
import {
  useAtualizarCliente,
  useAutorizarTransporte,
  useClientes,
  useCriarCliente,
  useDesautorizarTransporte,
} from '../hooks';
import { clienteFormSchema, type Cliente, type ClienteFormValues } from '../schema';

export function ClientesPage() {
  const query = useClientes();
  const tipos = useTiposTransporte();
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [managing, setManaging] = useState<Cliente | null>(null);

  const tipoNome = (id: string) => tipos.data?.find((t) => t.id === id)?.nome ?? id;

  return (
    <div>
      <div className="spread">
        <h1>Clientes</h1>
        <Button onClick={() => setCreating(true)}>Novo cliente</Button>
      </div>

      <div className="card">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorAlert error={query.error} />
        ) : (
          <Table
            columns={['Nome', 'Documento', 'Tipo', 'Transportes autorizados', 'Ações']}
            isEmpty={(query.data ?? []).length === 0}
            empty="Nenhum cliente cadastrado."
          >
            {query.data?.map((c) => (
              <tr key={c.id} data-testid="cliente-row">
                <td>{c.nome}</td>
                <td className="mono">{c.documento}</td>
                <td>{c.tipoDocumento}</td>
                <td>
                  {c.transportesAutorizados.length === 0 ? (
                    <span className="muted">Nenhum</span>
                  ) : (
                    <span>{c.transportesAutorizados.map(tipoNome).join(', ')}</span>
                  )}
                </td>
                <td>
                  <div className="row" style={{ gap: '0.4rem' }}>
                    <Button variant="secondary" small onClick={() => setEditing(c)}>
                      Editar
                    </Button>
                    <Button variant="secondary" small onClick={() => setManaging(c)}>
                      Transportes
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {creating ? (
        <ClienteForm
          title="Novo cliente"
          submitLabel="Criar"
          pending={criar.isPending}
          error={criar.error}
          onClose={() => setCreating(false)}
          onSubmit={(values) => criar.mutate(values, { onSuccess: () => setCreating(false) })}
        />
      ) : null}

      {editing ? (
        <ClienteForm
          title="Editar cliente"
          submitLabel="Salvar"
          pending={atualizar.isPending}
          error={atualizar.error}
          defaultValues={{ nome: editing.nome, documento: editing.documento }}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            atualizar.mutate({ id: editing.id, values }, { onSuccess: () => setEditing(null) })
          }
        />
      ) : null}

      {managing ? (
        <TransportesManager
          // re-resolve a partir da lista atualizada para refletir mudanças
          cliente={query.data?.find((c) => c.id === managing.id) ?? managing}
          onClose={() => setManaging(null)}
        />
      ) : null}
    </div>
  );
}

interface FormProps {
  title: string;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  defaultValues?: ClienteFormValues;
  onClose: () => void;
  onSubmit: (values: ClienteFormValues) => void;
}

function ClienteForm({ title, submitLabel, pending, error, defaultValues, onClose, onSubmit }: FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: defaultValues ?? { nome: '', documento: '' },
  });

  return (
    <Modal title={title} onClose={onClose}>
      {error ? <ErrorAlert error={error} /> : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Nome" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" {...register('nome')} />
        </Field>
        <Field label="Documento (CPF ou CNPJ)" htmlFor="documento" error={errors.documento?.message}>
          <Input id="documento" placeholder="somente números ou com máscara" {...register('documento')} />
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TransportesManager({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const tipos = useTiposTransporte();
  const autorizar = useAutorizarTransporte();
  const desautorizar = useDesautorizarTransporte();
  const [selecionado, setSelecionado] = useState('');

  const tipoNome = (id: string) => tipos.data?.find((t) => t.id === id)?.nome ?? id;
  const disponiveis = (tipos.data ?? []).filter((t) => !cliente.transportesAutorizados.includes(t.id));
  const mutationError = autorizar.error ?? desautorizar.error;

  return (
    <Modal title={`Transportes — ${cliente.nome}`} onClose={onClose}>
      {mutationError ? <ErrorAlert error={mutationError} /> : null}

      <h2 style={{ fontSize: '1rem' }}>Autorizados</h2>
      {cliente.transportesAutorizados.length === 0 ? (
        <p className="muted">Nenhum transporte autorizado.</p>
      ) : (
        <div className="tag-list" style={{ marginBottom: '1rem' }}>
          {cliente.transportesAutorizados.map((id) => (
            <span className="tag" key={id} data-testid="transporte-tag">
              {tipoNome(id)}
              <button
                type="button"
                aria-label={`Remover ${tipoNome(id)}`}
                disabled={desautorizar.isPending}
                onClick={() =>
                  desautorizar.mutate({ clienteId: cliente.id, tipoTransporteId: id })
                }
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1rem' }}>Autorizar novo</h2>
      {tipos.isLoading ? (
        <Spinner />
      ) : (
        <div className="row">
          <Select
            aria-label="Tipo de transporte"
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
          >
            <option value="">Selecione...</option>
            {disponiveis.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.codigo})
              </option>
            ))}
          </Select>
          <Button
            disabled={!selecionado || autorizar.isPending}
            onClick={() => {
              autorizar.mutate(
                { clienteId: cliente.id, tipoTransporteId: selecionado },
                { onSuccess: () => setSelecionado('') },
              );
            }}
          >
            Autorizar
          </Button>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
}
