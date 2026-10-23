// Markdown to HTML for the brand book, component guidelines and governance docs.
// ponytail: no sanitizer; the content is the organization's own files. Add one when systems are shared across tenants.
import { marked } from "marked";

export const renderMarkdown = (md: string): string => marked.parse(md, { async: false }) as string;

export function Markdown({ source, html }: { source?: string; html?: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html ?? renderMarkdown(source ?? "") }} />;
}
