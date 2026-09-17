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

/** The one table used by every list/board screen, styled for a card container. */
export function BoardTable<T>({ rows, columns, keyFn, emptyLabel }: BoardTableProps<T>) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left text-text-muted">
          {columns.map((column) => (
            <th key={column.header} className="px-5 py-3 font-normal">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={keyFn(row)}
            className="border-b border-border last:border-b-0 hover:bg-bg-base/60"
          >
            {columns.map((column) => (
              <td key={column.header} className="px-5 py-3">
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
