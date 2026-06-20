import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { Field } from '../../../components/ui/Field';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { Table } from '../../../components/ui/Table';
import { formatDateTime } from '../../../lib/format';
import { useCriarItem, useItens } from '../hooks';
import { itemFormSchema, type ItemFormValues } from '../schema';

export function ItensPage() {
  const query = useItens();
  const criar = useCriarItem();
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="spread">
        <h1>Itens</h1>
        <Button onClick={() => setCreating(true)}>Novo item</Button>
      </div>

      <div className="card">
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorAlert error={query.error} />
        ) : (
          <Table
            columns={['SKU', 'Descrição', 'Unidade', 'Ativo', 'Criado em']}
            isEmpty={(query.data ?? []).length === 0}
            empty="Nenhum item cadastrado."
          >
            {query.data?.map((i) => (
              <tr key={i.id} data-testid="item-row">
                <td className="mono">{i.sku}</td>
                <td>{i.descricao}</td>
                <td>{i.unidade}</td>
                <td>{i.ativo ? 'Sim' : 'Não'}</td>
                <td>{formatDateTime(i.criadoEm)}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {creating ? (
        <ItemForm
          pending={criar.isPending}
          error={criar.error}
          onClose={() => setCreating(false)}
          onSubmit={(values) => criar.mutate(values, { onSuccess: () => setCreating(false) })}
        />
      ) : null}
    </div>
  );
}

interface FormProps {
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
}

function ItemForm({ pending, error, onClose, onSubmit }: FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: { sku: '', descricao: '', unidade: '' },
  });

  return (
    <Modal title="Novo item" onClose={onClose}>
      {error ? <ErrorAlert error={error} /> : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="SKU" htmlFor="sku" error={errors.sku?.message}>
          <Input id="sku" {...register('sku')} />
        </Field>
        <Field label="Descrição" htmlFor="descricao" error={errors.descricao?.message}>
          <Input id="descricao" {...register('descricao')} />
        </Field>
        <Field label="Unidade" htmlFor="unidade" error={errors.unidade?.message}>
          <Input id="unidade" placeholder="ex.: UN, KG, CX" {...register('unidade')} />
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
