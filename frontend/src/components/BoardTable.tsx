import { ReactNode } from 'react';

export interface BoardTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface BoardTableProps<T> {
  rows: T[];
  columns: BoardTableColumn<T>[];
  keyFn: (row: T) => string;
  emptyState: ReactNode;
}

/** The one table used by every list/board screen, styled for a card container. */
export function BoardTable<T>({ rows, columns, keyFn, emptyState }: BoardTableProps<T>) {
  if (rows.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          {columns.map((column) => (
            <th
              key={column.header}
              className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={keyFn(row)}
            className="border-b border-border transition-colors duration-100 last:border-b-0 hover:bg-bg-elevated/60"
          >
            {columns.map((column) => (
              <td key={column.header} className="px-5 py-3.5 text-text-secondary">
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
