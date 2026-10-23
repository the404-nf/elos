"use client";
// The control for a token value, chosen by type. Dimension tokens that alias a scale get a slider whose
// stops are the scale's tokens, so dragging writes an alias, never a raw pixel value.
import type { ResolvedToken } from "@elos/contracts";
import { TokenPreview } from "./token-preview.tsx";
import type { Stop } from "@/lib/scale.ts";

export type { Stop };

export function TokenControl({ token, raw, resolved, theme, stops, tokenPaths, onChange }: {
  token: ResolvedToken;
  raw: string;
  resolved: string;
  theme: string;
  stops: Stop[];
  tokenPaths: string[];
  onChange: (raw: string) => void;
}) {
  const { type } = token;
  const aliasOf = raw.trim().match(/^\{([^{}]+)\}$/)?.[1];
  const idx = stops.findIndex((s) => s.path === aliasOf || (!aliasOf && s.value === resolved.trim()));
  const isHex = /^#[0-9a-f]{6}$/i.test(resolved);
  const text = (
    <input list="token-paths" value={raw} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, minWidth: 0 }} aria-label={`${theme} value`} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
        {type === "color" ? (
          <span style={{ position: "relative", display: "inline-flex" }} title="Text on this color: primary and inverse">
            <TokenPreview token={{ ...token, value: resolved }} size={36} />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: 600, pointerEvents: "none" }}>
              <span style={{ color: "var(--color-text-primary)" }}>A</span>
              <span style={{ color: "var(--color-text-inverse)" }}>a</span>
            </span>
          </span>
        ) : (
          <TokenPreview token={{ ...token, value: resolved }} size={36} />
        )}
        {type === "color" && (
          <input type="color" value={isHex ? resolved.toLowerCase() : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={`${theme} color`}
            style={{ width: 36, height: 32, padding: 0, border: 0, background: "none", cursor: "pointer", flex: "none" }} />
        )}
        {type === "fontWeight" ? (
          <select value={resolved} onChange={(e) => onChange(e.target.value)} aria-label={`${theme} weight`}>
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        ) : type === "number" && Number(resolved) >= 0 && Number(resolved) <= 1 ? (
          <input type="range" min={0} max={1} step={0.05} value={Number(resolved)} onChange={(e) => onChange(e.target.value)} aria-label={`${theme} number`} style={{ flex: 1 }} />
        ) : null}
        {text}
      </div>
      {stops.length > 1 && (
        <div className="scale">
          <input type="range" min={0} max={stops.length - 1} step={1} value={idx < 0 ? 0 : idx} aria-label={`${theme} scale`}
            onChange={(e) => onChange(`{${stops[Number(e.target.value)]!.path}}`)} list={`scale-${token.path}-${theme}`} />
          <datalist id={`scale-${token.path}-${theme}`}>{stops.map((s, i) => <option key={s.path} value={i} label={s.value} />)}</datalist>
          <div className="scale-labels">
            {stops.map((s, i) => (
              <button key={s.path} type="button" onClick={() => onChange(`{${s.path}}`)} className={i === idx ? "on" : ""} title={s.path}>
                {s.value}
              </button>
            ))}
          </div>
          {idx < 0 && <span className="muted" style={{ fontSize: 12 }}>Off the scale: pick a stop to bind to a token.</span>}
        </div>
      )}
      <span style={{ fontSize: 12 }} className="muted">→ {resolved || "unresolved"}</span>
      <datalist id="token-paths">{tokenPaths.map((p) => <option key={p} value={`{${p}}`} />)}</datalist>
    </div>
  );
}
