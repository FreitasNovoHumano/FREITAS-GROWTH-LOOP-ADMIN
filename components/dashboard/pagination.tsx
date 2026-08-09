import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      const normalized = Array.isArray(value) ? value[0] : value;
      if (normalized && key !== "page") params.set(key, normalized);
    }
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };

  return (
    <nav className="pagination" aria-label="Paginação">
      <span>
        Página {page} de {totalPages} · {total} registros
      </span>
      <div>
        {page > 1 && <Link href={hrefFor(page - 1)}>Anterior</Link>}
        {page < totalPages && <Link href={hrefFor(page + 1)}>Próxima</Link>}
      </div>
    </nav>
  );
}
