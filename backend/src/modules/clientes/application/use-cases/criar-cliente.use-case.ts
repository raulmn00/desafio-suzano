import { Clock } from '../../../../shared/application/ports/clock';
import { IdGenerator } from '../../../../shared/application/ports/id-generator';
import { Cliente } from '../../domain/cliente.entity';
import { ClienteRepository } from '../../domain/cliente.repository';
import { DocumentoJaCadastradoError } from '../../domain/cliente.errors';
import { apresentarCliente, ClienteView } from '../cliente.presenter';

export interface CriarClienteInput {
  nome: string;
  documento: string;
}

export class CriarClienteUseCase {
  constructor(
    private readonly repositorio: ClienteRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async executar(input: CriarClienteInput): Promise<ClienteView> {
    const cliente = Cliente.criar({
      id: this.idGenerator.gerar(),
      nome: input.nome,
      documento: input.documento,
      agora: this.clock.agora(),
    });

    const existente = await this.repositorio.buscarPorDocumento(cliente.documento.valor);
    if (existente) {
      throw new DocumentoJaCadastradoError(cliente.documento.valor);
    }

    await this.repositorio.salvar(cliente);
    return apresentarCliente(cliente);
  }
}
