export function ListFilters({
  search,
  status,
  statuses = [],
}: {
  search: string;
  status?: string;
  statuses?: readonly { value: string; label: string }[];
}) {
  return (
    <form className="toolbar" method="get">
      <label className="filter-field">
        <span>Buscar</span>
        <input
          name="search"
          defaultValue={search}
          placeholder="Digite para pesquisar..."
        />
      </label>
      {statuses.length > 0 && (
        <label className="filter-field">
          <span>Status</span>
          <select name="status" defaultValue={status}>
            <option value="">Todos</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="filter-field">
        <span>Data inicial</span>
        <input name="dateFrom" type="date" />
      </label>
      <label className="filter-field">
        <span>Data final</span>
        <input name="dateTo" type="date" />
      </label>
      <button className="button primary" type="submit">
        Aplicar filtros
      </button>
    </form>
  );
}
