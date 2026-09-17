import { ReactNode } from 'react';

export interface BoardTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface BoardTableProps<T> {
  rows: T[];
  columns: BoardTableColumn<T>[];
  keyFn: (row: T) => string;
  emptyLabel: string;
}

/**
 * The one dense, hairline-divided, monospace-set table used by the
 * overview board and every list screen - departure-board style, no
 * rounded cards, no zebra striping.
 */
export function BoardTable<T>({ rows, columns, keyFn, emptyLabel }: BoardTableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-4 font-mono text-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left text-text-muted">
          {columns.map((column) => (
            <th key={column.header} className="py-2 pr-4 font-normal">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={keyFn(row)} className="border-b border-border last:border-b-0">
            {columns.map((column) => (
              <td key={column.header} className="py-2 pr-4">
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
