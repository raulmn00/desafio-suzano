import { PapelUsuario, PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

async function seedUsuarios(): Promise<void> {
  const usuarios = [
    {
      email: process.env.SEED_OPERADOR_EMAIL ?? 'operador@ovgs.dev',
      senha: process.env.SEED_OPERADOR_SENHA ?? 'operador123',
      nome: 'Operador OVGS',
      papel: PapelUsuario.OPERADOR,
    },
    {
      email: process.env.SEED_AUDITOR_EMAIL ?? 'auditor@ovgs.dev',
      senha: process.env.SEED_AUDITOR_SENHA ?? 'auditor123',
      nome: 'Auditor OVGS',
      papel: PapelUsuario.AUDITOR,
    },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, papel: u.papel, ativo: true },
      create: {
        id: randomUUID(),
        email: u.email,
        nome: u.nome,
        senhaHash: hashSync(u.senha, 10),
        papel: u.papel,
        ativo: true,
      },
    });
  }
}

async function seedCatalogos(): Promise<{ transporteIds: string[]; itemIds: string[] }> {
  const tipos = [
    { nome: 'Caminhão', codigo: 'CAM' },
    { nome: 'Carreta', codigo: 'CAR' },
    { nome: 'Bi-truck', codigo: 'BIT' },
  ];
  const transporteIds: string[] = [];
  for (const t of tipos) {
    const tipo = await prisma.tipoTransporte.upsert({
      where: { codigo: t.codigo },
      update: { nome: t.nome },
      create: { id: randomUUID(), nome: t.nome, codigo: t.codigo },
    });
    transporteIds.push(tipo.id);
  }

  const itens = [
    { sku: 'SKU-001', descricao: 'Pallet de papel A4', unidade: 'PL' },
    { sku: 'SKU-002', descricao: 'Caixa de toner', unidade: 'CX' },
    { sku: 'SKU-003', descricao: 'Bobina de filme stretch', unidade: 'UN' },
  ];
  const itemIds: string[] = [];
  for (const i of itens) {
    const item = await prisma.item.upsert({
      where: { sku: i.sku },
      update: { descricao: i.descricao, unidade: i.unidade },
      create: { id: randomUUID(), sku: i.sku, descricao: i.descricao, unidade: i.unidade },
    });
    itemIds.push(item.id);
  }

  return { transporteIds, itemIds };
}

async function seedCliente(transporteIds: string[]): Promise<void> {
  const documento = '11222333000181';
  const cliente = await prisma.cliente.upsert({
    where: { documento },
    update: { nome: 'Suzano Distribuição S.A.' },
    create: { id: randomUUID(), nome: 'Suzano Distribuição S.A.', documento },
  });

  // Autoriza Caminhão e Carreta para o cliente de exemplo.
  for (const tipoTransporteId of transporteIds.slice(0, 2)) {
    await prisma.clienteTipoTransporte.upsert({
      where: { clienteId_tipoTransporteId: { clienteId: cliente.id, tipoTransporteId } },
      update: {},
      create: { clienteId: cliente.id, tipoTransporteId },
    });
  }
}

async function main(): Promise<void> {
  await seedUsuarios();
  const { transporteIds } = await seedCatalogos();
  await seedCliente(transporteIds);
  // eslint-disable-next-line no-console
  console.log('Seed concluído: usuários, tipos de transporte, itens e cliente de exemplo.');
}

main()
  .catch((erro) => {
    // eslint-disable-next-line no-console
    console.error('Falha no seed:', erro);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
