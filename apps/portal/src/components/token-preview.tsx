// A visual for a token value, by type and by what the path says it is for. Pure markup, renders on the server.
import type { ResolvedToken } from "@elos/contracts";

export function TokenPreview({ token, size = 36 }: { token: ResolvedToken; size?: number }) {
  const { type, value, path } = token;
  const box = { display: "inline-block", width: size, height: size, borderRadius: "var(--radius-control)", border: "var(--border-width) solid var(--color-border-subtle)", flex: "none", verticalAlign: "middle" } as const;

  if (type === "color") return <span style={{ ...box, background: value }} title={value} />;

  if (type === "fontFamily") return <span style={{ fontFamily: value, fontSize: size * 0.6, lineHeight: 1 }}>Aa</span>;
  if (type === "fontWeight") return <span style={{ fontWeight: Number(value), fontSize: size * 0.6, lineHeight: 1 }}>Aa</span>;

  if (type === "dimension") {
    const px = parseFloat(value);
    if (path.includes("radius")) return <span style={{ ...box, borderRadius: Math.min(px, size / 2), background: "var(--color-surface-raised)", borderColor: "var(--color-border-strong)" }} />;
    if (path.includes("font") || (path.includes("size") && path.includes("type"))) return <span style={{ fontSize: value, lineHeight: 1 }}>Aa</span>;
    // spacing, widths, heights, border widths: a bar of that length
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: size }}>
        <span style={{ display: "inline-block", width: Math.min(px, 120), height: path.includes("border") ? px : 8, background: "var(--color-action-primary-background)", borderRadius: "var(--radius-sm)" }} />
      </span>
    );
  }

  if (type === "number") {
    const n = Number(value);
    if (n >= 0 && n <= 1) return <span style={{ ...box, background: "var(--color-text-primary)", opacity: n }} title={`opacity ${n}`} />;
  }

  return <code style={{ fontSize: "var(--font-size-sm)" }}>{value}</code>;
}
