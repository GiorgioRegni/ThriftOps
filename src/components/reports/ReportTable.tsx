export const ReportTable = ({ columns, rows }: { columns: string[]; rows: Array<Record<string, unknown>> }) => (
  <div className="app-card overflow-x-auto">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-white text-xs text-muted">
        <tr>{columns.map((column) => <th className="border-b border-slate-100 px-4 py-3 font-semibold" key={column}>{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-slate-100 last:border-0">
            {columns.map((column) => <td className="whitespace-nowrap px-4 py-3 text-sm" key={column}>{String(row[column] ?? "")}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
