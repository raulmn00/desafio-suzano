import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { useAuth } from '../../../auth/useAuth';
import { formatDateTime } from '../../../lib/format';
import { useClientes } from '../../clientes/hooks';
import { useItens } from '../../itens/hooks';
import { useTiposTransporte } from '../../tipos-transporte/hooks';
import { useCriarOrdem, useOrdens } from '../hooks';
import { criarOrdemFormSchema, type CriarOrdemFormValues } from '../schema';

export function OrdensPage() {
  const { isOperador } = useAuth();
  const ordens = useOrdens();
  const clientes = useClientes();
  const [creating, setCreating] = useState(false);

  const clienteNome = (id: string) => clientes.data?.find((c) => c.id === id)?.nome ?? id;

  return (
    <div>
      <div className="spread">
        <h1>Ordens de Venda</h1>
        {isOperador ? (
          <Button onClick={() => setCreating(true)} data-testid="nova-ov">
            Nova ordem
          </Button>
        ) : null}
      </div>

      <div className="card">
        {ordens.isLoading ? (
          <Spinner />
        ) : ordens.isError ? (
          <ErrorAlert error={ordens.error} />
        ) : (
          <Table
            columns={['ID', 'Cliente', 'Status', 'Itens', 'Criado em', '']}
            isEmpty={(ordens.data ?? []).length === 0}
            empty="Nenhuma ordem de venda cadastrada."
          >
            {ordens.data?.map((o) => (
              <tr key={o.id} data-testid="ov-row">
                <td className="mono">{o.id.slice(0, 8)}</td>
                <td>{clienteNome(o.clienteId)}</td>
                <td>
                  <Badge status={o.status} />
                </td>
                <td>{o.itens.length}</td>
                <td>{formatDateTime(o.criadoEm)}</td>
                <td>
                  <Link to={`/ordens/${o.id}`}>Detalhe</Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {creating ? <CriarOrdemModal onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function CriarOrdemModal({ onClose }: { onClose: () => void }) {
  const clientes = useClientes();
  const tipos = useTiposTransporte();
  const itens = useItens();
  const criar = useCriarOrdem();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CriarOrdemFormValues>({
    resolver: zodResolver(criarOrdemFormSchema),
    defaultValues: { clienteId: '', tipoTransporteId: '', itens: [{ itemId: '', quantidade: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });
  const clienteId = watch('clienteId');

  const clienteSelecionado = clientes.data?.find((c) => c.id === clienteId);
  // Só transportes AUTORIZADOS do cliente escolhido.
  const transportesAutorizados = (tipos.data ?? []).filter((t) =>
    clienteSelecionado?.transportesAutorizados.includes(t.id),
  );

  const loading = clientes.isLoading || tipos.isLoading || itens.isLoading;

  return (
    <Modal title="Nova ordem de venda" onClose={onClose}>
      {criar.isError ? <ErrorAlert error={criar.error} /> : null}
      {loading ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit((values) => criar.mutate(values, { onSuccess: onClose }))} noValidate>
          <Field label="Cliente" htmlFor="clienteId" error={errors.clienteId?.message}>
            <Select
              id="clienteId"
              {...register('clienteId')}
              onChange={(e) => {
                setValue('clienteId', e.target.value);
                setValue('tipoTransporteId', ''); // reseta transporte ao trocar cliente
              }}
            >
              <option value="">Selecione...</option>
              {clientes.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Transporte (autorizados do cliente)" htmlFor="tipoTransporteId" error={errors.tipoTransporteId?.message}>
            <Select id="tipoTransporteId" {...register('tipoTransporteId')} disabled={!clienteId}>
              <option value="">
                {!clienteId
                  ? 'Selecione um cliente primeiro'
                  : transportesAutorizados.length === 0
                    ? 'Cliente sem transportes autorizados'
                    : 'Selecione...'}
              </option>
              {transportesAutorizados.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.codigo})
                </option>
              ))}
            </Select>
          </Field>

          <h2 style={{ fontSize: '1rem', marginTop: '1rem' }}>Itens</h2>
          {errors.itens?.root?.message ? <span className="error">{errors.itens.root.message}</span> : null}
          {errors.itens?.message ? <span className="error">{errors.itens.message}</span> : null}

          {fields.map((field, index) => (
            <div className="item-line" key={field.id} data-testid="item-line">
              <Field
                label="Item"
                htmlFor={`item-${index}`}
                error={errors.itens?.[index]?.itemId?.message}
              >
                <Select id={`item-${index}`} {...register(`itens.${index}.itemId`)}>
                  <option value="">Selecione...</option>
                  {itens.data?.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.sku} — {it.descricao}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Qtd"
                htmlFor={`qtd-${index}`}
                error={errors.itens?.[index]?.quantidade?.message}
              >
                <Input
                  id={`qtd-${index}`}
                  type="number"
                  min={1}
                  step={1}
                  style={{ width: 90 }}
                  {...register(`itens.${index}.quantidade`)}
                />
              </Field>
              <Button
                type="button"
                variant="danger"
                small
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                Remover
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            small
            onClick={() => append({ itemId: '', quantidade: 1 })}
            data-testid="add-item"
          >
            + Adicionar item
          </Button>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending} data-testid="submit-ov">
              {criar.isPending ? 'Criando...' : 'Criar ordem'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
