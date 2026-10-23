// Playground: every contract example, every theme, with real behavior. The seed of the portal preview.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Catalog } from "@elos/contracts";
import { ElosProvider, Render } from "@elos/react";
import { zagBehaviors } from "@elos/react/behaviors";
import catalogJson from "../../../Resonant DS/dist/catalog.json";
import "../../../Resonant DS/dist/tokens.css";
import "../../../Resonant DS/dist/components.css";

const catalog = Catalog.parse(catalogJson);
const themes = ["light", ...catalog.system.themes.map((t) => t.name)];

function App() {
  const [theme, setTheme] = useState(themes[0]!);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ElosProvider catalog={catalog} behaviors={zagBehaviors}>
      <main style={{ minHeight: "100vh", background: "var(--color-surface-canvas)", color: "var(--color-text-primary)", fontFamily: "var(--font-family-sans)", padding: 32 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: "var(--type-title-size)" }}>
            {catalog.system.name} <small style={{ opacity: 0.6, fontWeight: 400 }}>v{catalog.system.version}</small>
          </h1>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Theme">
            {themes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </header>
        {catalog.contracts
          .filter((c) => c.examples.length)
          .map((c) => (
            <section key={c.id} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: "var(--type-heading-size)", margin: "0 0 4px" }}>
                {c.name} <code style={{ opacity: 0.6, fontWeight: 400, fontSize: "var(--font-size-sm)" }}>{c.id}</code>
              </h2>
              <p style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>{c.description}</p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                {c.examples.map((e) => (
                  <figure key={e.name} style={{ margin: 0, minWidth: 200 }}>
                    <Render tree={e.tree} />
                    <figcaption style={{ marginTop: 8, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>{e.name}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
      </main>
    </ElosProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
