import { templateVariables } from "@/modules/growth-loop/email/templates";

export function renderTemplate(value: string, variables: Record<string, string | number | undefined>) {
  let rendered = value;
  for (const name of new Set(templateVariables(value))) {
    const replacement = variables[name];
    rendered = rendered.replaceAll(new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, "g"), replacement === undefined ? "" : String(replacement));
  }
  return rendered;
}
