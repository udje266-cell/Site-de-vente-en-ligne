import { marked } from "marked";

/** Markdown -> HTML. Le HTML brut est échappé (seul l'admin écrit le contenu, mais on reste prudent). */
export function renderMarkdown(md: string): string {
  const escaped = md.replace(/</g, "&lt;");
  return marked.parse(escaped, { async: false, gfm: true, breaks: true }) as string;
}
