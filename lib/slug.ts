export function normalizeCampaignSlug(value: string) {
  let source = value.trim();

  try {
    const url = new URL(source);
    const segments = url.pathname.split("/").filter(Boolean);
    source = segments.at(-1) ?? "";
  } catch {
    source = source.split(/[?#]/, 1)[0] ?? "";
    const segments = source.split("/").filter(Boolean);
    if (segments.length > 1) source = segments.at(-1) ?? "";
  }

  try {
    source = decodeURIComponent(source);
  } catch {
    // Mantém o texto original quando houver uma sequência percent-encoded inválida.
  }

  return source
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
