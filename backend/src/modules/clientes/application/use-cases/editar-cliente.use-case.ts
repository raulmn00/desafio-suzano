import { Clock } from '../../../../shared/application/ports/clock';
import { Documento } from '../../domain/documento.vo';
import { ClienteRepository } from '../../domain/cliente.repository';
import { ClienteNaoEncontradoError, DocumentoJaCadastradoError } from '../../domain/cliente.errors';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export interface EditarClienteInput {
  id: string;
  nome?: string;
  documento?: string;
}

export class EditarClienteUseCase {
  constructor(
    private readonly repositorio: ClienteRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: EditarClienteInput): Promise<ClienteView> {
    const cliente = await this.repositorio.buscarPorId(input.id);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(input.id);
    }

    // Unicidade do documento checada antes de mutar.
    if (input.documento !== undefined) {
      const documento = Documento.criar(input.documento);
      const existente = await this.repositorio.buscarPorDocumento(documento.valor);
      if (existente && existente.id !== cliente.id) {
        throw new DocumentoJaCadastradoError(documento.valor);
      }
    }

    cliente.editar({ nome: input.nome, documento: input.documento }, this.clock.agora());
    await this.repositorio.salvar(cliente);
    return apresentarCliente(cliente);
  }
}
