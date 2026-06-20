import { http } from '../../lib/http';
import { itemListSchema, itemSchema, type Item, type ItemFormValues } from './schema';

export async function listarItens(): Promise<Item[]> {
  const { data } = await http.get('/itens');
  return itemListSchema.parse(data);
}

export async function obterItem(id: string): Promise<Item> {
  const { data } = await http.get(`/itens/${id}`);
  return itemSchema.parse(data);
}

export async function criarItem(values: ItemFormValues): Promise<Item> {
  const { data } = await http.post('/itens', values);
  return itemSchema.parse(data);
}
