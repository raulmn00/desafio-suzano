import type { ReactNode } from 'react';

interface TableProps {
  columns: string[];
  /** número de linhas; usado para colspan da mensagem de vazio */
  empty?: string;
  isEmpty?: boolean;
  children?: ReactNode;
}

export function Table({ columns, empty = 'Nenhum registro encontrado.', isEmpty, children }: TableProps) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isEmpty ? (
          <tr>
            <td className="table-empty" colSpan={columns.length}>
              {empty}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  );
}
