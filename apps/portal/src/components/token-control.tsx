"use client";
// The control for a token value, chosen by type. Dimension tokens that alias a scale get a slider whose
// stops are the scale's tokens, so dragging writes an alias, never a raw pixel value.
// ponytail: the color and range pickers are native inputs; Resonant has no contract for them yet (roadmap: scale sliders).
import type { ResolvedToken } from "@elos/contracts";
import { Button, Input, Select, Stack, Text, options } from "./elos-client.tsx";
import { TokenPreview } from "./token-preview.tsx";
import type { Stop } from "@/lib/scale.ts";

export type { Stop };
const WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];

export function TokenControl({ token, raw, resolved, theme, stops, onChange }: {
  token: ResolvedToken;
  raw: string;
  resolved: string;
  theme: string;
  stops: Stop[];
  onChange: (raw: string) => void;
}) {
  const { type } = token;
  const aliasOf = raw.trim().match(/^\{([^{}]+)\}$/)?.[1];
  const idx = stops.findIndex((s) => s.path === aliasOf || (!aliasOf && s.value === resolved.trim()));
  const isHex = /^#[0-9a-f]{6}$/i.test(resolved);

  return (
    <Stack gap="xs">
      <Stack direction="row" gap="sm" align="center">
        {type === "color" ? (
          <span style={{ position: "relative", display: "inline-flex", flex: "none" }} title="Text on this color: primary and inverse">
            <TokenPreview token={{ ...token, value: resolved }} size={36} />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", pointerEvents: "none" }}>
              <span style={{ color: "var(--color-text-primary)" }}>A</span>
              <span style={{ color: "var(--color-text-inverse)" }}>a</span>
            </span>
          </span>
        ) : (
          <TokenPreview token={{ ...token, value: resolved }} size={36} />
        )}
        {type === "color" && <input type="color" value={isHex ? resolved.toLowerCase() : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={`${theme} color`} />}
        {type === "fontWeight" ? (
          <Select size="sm" value={resolved} aria-label={`${theme} weight`} onChange={(e) => onChange(e.target.value)}>{options(WEIGHTS, Object.fromEntries(WEIGHTS.map((w) => [w, w])))}</Select>
        ) : type === "number" && Number(resolved) >= 0 && Number(resolved) <= 1 ? (
          <input type="range" min={0} max={1} step={0.05} value={Number(resolved)} onChange={(e) => onChange(e.target.value)} aria-label={`${theme} number`} style={{ flex: 1 }} />
        ) : null}
        <Input size="sm" list="token-paths" value={raw} aria-label={`${theme} value`} onChange={(e) => onChange(e.target.value)} />
      </Stack>
      {stops.length > 1 && (
        <div className="scale">
          <input type="range" min={0} max={stops.length - 1} step={1} value={idx < 0 ? 0 : idx} aria-label={`${theme} scale`}
            onChange={(e) => onChange(`{${stops[Number(e.target.value)]!.path}}`)} list={`scale-${token.path}-${theme}`} />
          <datalist id={`scale-${token.path}-${theme}`}>{stops.map((s, i) => <option key={s.path} value={i} label={s.value} />)}</datalist>
          <div className="scale-labels">
            {stops.map((s, i) => (
              <Button key={s.path} label={s.value} size="sm" variant={i === idx ? "secondary" : "ghost"} aria-pressed={i === idx} title={s.path} onClick={() => onChange(`{${s.path}}`)} />
            ))}
          </div>
          {idx < 0 && <Text as="span" variant="caption" tone="secondary" text="Off the scale: pick a stop to bind to a token." />}
        </div>
      )}
      <Text as="span" variant="caption" tone="secondary" text={`→ ${resolved || "unresolved"}`} style={{ fontFamily: "var(--font-family-mono)" }} />
    </Stack>
  );
}
