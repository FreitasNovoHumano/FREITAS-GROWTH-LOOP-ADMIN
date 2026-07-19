import { escapeHtml } from "@/lib/email";

export function renderEmailTemplate(source: string, variables: Record<string, string>) {
  return source.replace(/\{\{\s*([a-zA-Z][\w]*)\s*\}\}/g, (_match, key: string) => {
    return escapeHtml(variables[key] ?? "");
  });
}
